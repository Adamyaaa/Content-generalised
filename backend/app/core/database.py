import json
import logging
import sqlite3
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional, Dict, Any

from app.core.config import settings
from app.models.profile import CompanyProfile
from app.models.queue import TrendQueueItem, QueueStatus
from app.models.analysis import ContentAnalysis
from app.models.concept import ContentConcept

logger = logging.getLogger(__name__)

DB_PATH = Path(settings.STORAGE_DIR) / "content_generalised.db"

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False


def _clean_json_field(val: Any) -> Any:
    """Helper to deserialize stringified JSON safely."""
    if val is None:
        return None
    if isinstance(val, (dict, list)):
        return val
    if isinstance(val, str):
        try:
            return json.loads(val)
        except Exception:
            return val
    return val


class Database:
    def __init__(self):
        self.use_postgres = False
        self.use_supabase = False
        self.supabase = None
        self.database_url = settings.DATABASE_URL.strip() if settings.DATABASE_URL else ""

        # Priority 1: PostgreSQL / Neon if DATABASE_URL is set
        if self.database_url:
            if not PSYCOPG2_AVAILABLE:
                logger.warning("DATABASE_URL provided but psycopg2-binary is not installed. Falling back.")
            else:
                # Normalize postgres:// to postgresql://
                if self.database_url.startswith("postgres://"):
                    self.database_url = "postgresql://" + self.database_url[len("postgres://"):]
                
                # Neon & cloud providers require SSL mode
                if "sslmode=" not in self.database_url and ("neon.tech" in self.database_url or "supabase.co" in self.database_url):
                    sep = "&" if "?" in self.database_url else "?"
                    self.database_url = f"{self.database_url}{sep}sslmode=require"

                try:
                    # Test connection
                    with psycopg2.connect(self.database_url) as test_conn:
                        with test_conn.cursor() as cursor:
                            cursor.execute("SELECT 1")
                    self.use_postgres = True
                    logger.info("Connected successfully to PostgreSQL / Neon database.")
                except Exception as e:
                    logger.warning(f"Failed to connect to PostgreSQL at DATABASE_URL ({e}). Falling back to Supabase/SQLite.")
                    self.use_postgres = False

        # Priority 2: Supabase REST API if configured and Postgres is not active
        if not self.use_postgres and settings.SUPABASE_URL and settings.SUPABASE_KEY:
            try:
                from supabase import create_client
                self.supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
                self.use_supabase = True
                logger.info("Connected to Supabase REST API.")
            except Exception as e:
                logger.warning(f"Failed to initialize Supabase ({e}). Falling back to local SQLite.")
                self.use_supabase = False

        if not self.use_postgres and not self.use_supabase:
            logger.info("Using local SQLite database at: %s", DB_PATH)

    @contextmanager
    def _get_postgres_conn(self):
        """Yield a fresh Postgres connection with RealDictCursor."""
        conn = psycopg2.connect(self.database_url, cursor_factory=RealDictCursor)
        try:
            yield conn
        finally:
            conn.close()

    def _get_sqlite_conn(self):
        conn = sqlite3.connect(str(DB_PATH))
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self):
        """Initialize database tables and seed default profiles if empty."""
        if self.use_postgres:
            self._init_postgres()
        elif not self.use_supabase:
            self._init_sqlite()
        self._seed_default_profiles()

    def _init_postgres(self):
        with self._get_postgres_conn() as conn:
            with conn.cursor() as cursor:
                # 1. company_profiles
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS company_profiles (
                        client_id TEXT PRIMARY KEY,
                        company_name TEXT NOT NULL,
                        industry TEXT NOT NULL,
                        tagline_or_mission TEXT NOT NULL,
                        products_and_services TEXT NOT NULL,
                        target_audience TEXT NOT NULL,
                        brand_voice_guidelines TEXT NOT NULL,
                        created_at TEXT NOT NULL
                    );
                """)

                # 2. trend_queue
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS trend_queue (
                        id TEXT PRIMARY KEY,
                        client_id TEXT NOT NULL,
                        source_type TEXT NOT NULL,
                        source_url TEXT,
                        file_path TEXT,
                        status TEXT NOT NULL,
                        progress_message TEXT NOT NULL,
                        error_message TEXT,
                        created_at TEXT NOT NULL,
                        updated_at TEXT NOT NULL,
                        FOREIGN KEY (client_id) REFERENCES company_profiles(client_id) ON DELETE CASCADE
                    );
                """)

                # 3. content_analysis
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS content_analysis (
                        id TEXT PRIMARY KEY,
                        queue_id TEXT NOT NULL,
                        source_url_or_file TEXT NOT NULL,
                        duration_seconds REAL,
                        video_url TEXT,
                        frame_urls TEXT,
                        observable_claims TEXT,
                        transcript TEXT NOT NULL,
                        hook_analysis TEXT NOT NULL,
                        narrative_structure TEXT NOT NULL,
                        visual_storytelling TEXT NOT NULL,
                        psychological_formula TEXT NOT NULL,
                        created_at TEXT NOT NULL,
                        FOREIGN KEY (queue_id) REFERENCES trend_queue(id) ON DELETE CASCADE
                    );
                """)
                for col in ["video_url TEXT", "frame_urls TEXT", "observable_claims TEXT"]:
                    try:
                        cursor.execute(f"ALTER TABLE content_analysis ADD COLUMN IF NOT EXISTS {col};")
                    except Exception:
                        pass

                # 4. content_concepts
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS content_concepts (
                        id TEXT PRIMARY KEY,
                        queue_id TEXT NOT NULL,
                        client_id TEXT NOT NULL,
                        client_name TEXT NOT NULL,
                        title TEXT NOT NULL,
                        target_platform TEXT NOT NULL,
                        scenes TEXT NOT NULL,
                        platform_ideations TEXT NOT NULL,
                        qa_evaluation TEXT NOT NULL,
                        source_formula TEXT NOT NULL,
                        created_at TEXT NOT NULL,
                        FOREIGN KEY (queue_id) REFERENCES trend_queue(id) ON DELETE CASCADE,
                        FOREIGN KEY (client_id) REFERENCES company_profiles(client_id) ON DELETE CASCADE
                    );
                """)
                conn.commit()
                logger.info("PostgreSQL / Neon database schema verified.")

    def _init_sqlite(self):
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        with self._get_sqlite_conn() as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS company_profiles (
                    client_id TEXT PRIMARY KEY,
                    company_name TEXT NOT NULL,
                    industry TEXT NOT NULL,
                    tagline_or_mission TEXT NOT NULL,
                    products_and_services TEXT NOT NULL,
                    target_audience TEXT NOT NULL,
                    brand_voice_guidelines TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );
            """)

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS trend_queue (
                    id TEXT PRIMARY KEY,
                    client_id TEXT NOT NULL,
                    source_type TEXT NOT NULL,
                    source_url TEXT,
                    file_path TEXT,
                    status TEXT NOT NULL,
                    progress_message TEXT NOT NULL,
                    error_message TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY (client_id) REFERENCES company_profiles(client_id)
                );
            """)

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS content_analysis (
                    id TEXT PRIMARY KEY,
                    queue_id TEXT NOT NULL,
                    source_url_or_file TEXT NOT NULL,
                    duration_seconds REAL,
                    video_url TEXT,
                    frame_urls TEXT,
                    observable_claims TEXT,
                    transcript TEXT NOT NULL,
                    hook_analysis TEXT NOT NULL,
                    narrative_structure TEXT NOT NULL,
                    visual_storytelling TEXT NOT NULL,
                    psychological_formula TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (queue_id) REFERENCES trend_queue(id) ON DELETE CASCADE
                );
            """)
            for col in ["video_url TEXT", "frame_urls TEXT", "observable_claims TEXT"]:
                try:
                    cursor.execute(f"ALTER TABLE content_analysis ADD COLUMN {col};")
                except Exception:
                    pass

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS content_concepts (
                    id TEXT PRIMARY KEY,
                    queue_id TEXT NOT NULL,
                    client_id TEXT NOT NULL,
                    client_name TEXT NOT NULL,
                    title TEXT NOT NULL,
                    target_platform TEXT NOT NULL,
                    scenes TEXT NOT NULL,
                    platform_ideations TEXT NOT NULL,
                    qa_evaluation TEXT NOT NULL,
                    source_formula TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (queue_id) REFERENCES trend_queue(id) ON DELETE CASCADE,
                    FOREIGN KEY (client_id) REFERENCES company_profiles(client_id)
                );
            """)
            conn.commit()

    def _seed_default_profiles(self):
        profiles = self.get_profiles()
        if not profiles:
            default_profiles = [
                CompanyProfile(
                    client_id="profile-devflow-01",
                    company_name="DevFlow AI",
                    industry="B2B Developer Tools & AI Infrastructure",
                    tagline_or_mission="Automating the toil in enterprise software delivery pipelines with deterministic AI agents.",
                    products_and_services=[
                        {
                            "name": "DevFlow Orchestrator",
                            "core_value_prop": "Autonomous agentic PR generation and continuous regression self-healing",
                            "pain_points_solved": ["Slow deployment cycles", "High engineer churn from flaky CI/CD pipelines", "Manual refactoring backlog"]
                        },
                        {
                            "name": "CodeReview Guard",
                            "core_value_prop": "Deterministic static and semantic security linting in under 12 seconds",
                            "pain_points_solved": ["Senior engineers spending 15+ hours/week reviewing boilerplate PRs", "Critical vulnerabilities missed in sprint rushes"]
                        }
                    ],
                    target_audience={
                        "icp_description": "Founders, VP of Engineering, and Staff Engineers at Seed-to-Series B software companies (US & India)",
                        "primary_frustrations": [
                            "Engineering velocity grinding to a halt past 20 developers",
                            "High cloud and CI runner bills with zero visibility into root cause bottlenecks",
                            "Hype-driven AI tools that break production code with hallucinated changes"
                        ],
                        "aspirations_and_goals": [
                            "Ship daily with 100% confidence and zero regression anxiety",
                            "Empower small engineering teams to punch 5x above their weight",
                            "Maintain clean, disciplined codebase architecture"
                        ],
                        "cultural_or_market_context": "Engineering rigor matters above all. No superficial AI hype. Skeptical of magic, respects real benchmarks and verifiable workflows."
                    },
                    brand_voice_guidelines={
                        "tone": "Authoritative, technical, contrarian, precise, grounded in real code and measurable engineering metrics.",
                        "prohibited_elements": [
                            "No emojis",
                            "No buzzword salad like 'game-changer', 'revolutionize', 'skyrocket'",
                            "No generic motivational cliches",
                            "No vague AI claims without architecture or code context"
                        ],
                        "signature_angles": [
                            "Real numbers & benchmark metrics (e.g., cut build times by 68%)",
                            "Technical teardowns of common architectural anti-patterns",
                            "Workflow breakdowns showing before-and-after terminal/git logs"
                        ],
                        "primary_cta": "Review our open-source benchmarks or deploy DevFlow sandbox in under 5 minutes."
                    }
                ),
                CompanyProfile(
                    client_id="profile-scaleops-02",
                    company_name="ScaleOps Health",
                    industry="HealthTech & Remote Clinical Operations",
                    tagline_or_mission="Modern asynchronous patient triage and compliance infrastructure for digital health clinics.",
                    products_and_services=[
                        {
                            "name": "ScaleOps Triage Hub",
                            "core_value_prop": "Automated HIPAA-compliant intake and asynchronous provider routing",
                            "pain_points_solved": ["70% of clinical staff time burned on repetitive paperwork", "High patient drop-off during initial onboarding"]
                        }
                    ],
                    target_audience={
                        "icp_description": "Clinical Directors and Founders of Telehealth practices and hybrid clinics",
                        "primary_frustrations": [
                            "Physician burnout from endless EHR administrative charting",
                            "Compliance headaches with interstate medical licensure",
                            "Rising patient acquisition cost without corresponding retention"
                        ],
                        "aspirations_and_goals": [
                            "Double patient throughput without hiring additional administrative coordinators",
                            "Provide white-glove, instant care response times"
                        ],
                        "cultural_or_market_context": "Patient safety and HIPAA compliance are paramount. Pragmatic, ROI-driven, patient-outcome focused."
                    },
                    brand_voice_guidelines={
                        "tone": "Empathetic yet rigorous, clinical-grade clarity, solutions-oriented.",
                        "prohibited_elements": [
                            "No emojis",
                            "No hyperbole or unregulated health claims",
                            "No gimmicky sales pitches"
                        ],
                        "signature_angles": [
                            "Clinical operational teardowns",
                            "Quantified provider burnout statistics",
                            "Calculated staff hour savings"
                        ],
                        "primary_cta": "Request our clinical efficiency benchmark report."
                    }
                )
            ]
            for p in default_profiles:
                self.create_profile(p)

    # ================= COMPANY PROFILES =================
    def get_profiles(self) -> List[CompanyProfile]:
        if self.use_postgres:
            with self._get_postgres_conn() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT * FROM company_profiles ORDER BY created_at ASC")
                    rows = cursor.fetchall()
                    profiles = []
                    for row in rows:
                        profiles.append(CompanyProfile(
                            client_id=row["client_id"],
                            company_name=row["company_name"],
                            industry=row["industry"],
                            tagline_or_mission=row["tagline_or_mission"],
                            products_and_services=_clean_json_field(row["products_and_services"]),
                            target_audience=_clean_json_field(row["target_audience"]),
                            brand_voice_guidelines=_clean_json_field(row["brand_voice_guidelines"])
                        ))
                    return profiles
        elif self.use_supabase:
            res = self.supabase.table("company_profiles").select("*").execute()
            profiles = []
            for row in res.data:
                profiles.append(CompanyProfile(
                    client_id=row["client_id"],
                    company_name=row["company_name"],
                    industry=row["industry"],
                    tagline_or_mission=row["tagline_or_mission"],
                    products_and_services=_clean_json_field(row["products_and_services"]),
                    target_audience=_clean_json_field(row["target_audience"]),
                    brand_voice_guidelines=_clean_json_field(row["brand_voice_guidelines"])
                ))
            return profiles
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM company_profiles ORDER BY created_at ASC")
                rows = cursor.fetchall()
                profiles = []
                for row in rows:
                    profiles.append(CompanyProfile(
                        client_id=row["client_id"],
                        company_name=row["company_name"],
                        industry=row["industry"],
                        tagline_or_mission=row["tagline_or_mission"],
                        products_and_services=_clean_json_field(row["products_and_services"]),
                        target_audience=_clean_json_field(row["target_audience"]),
                        brand_voice_guidelines=_clean_json_field(row["brand_voice_guidelines"])
                    ))
                return profiles

    def get_profile(self, client_id: str) -> Optional[CompanyProfile]:
        profiles = self.get_profiles()
        for p in profiles:
            if p.client_id == client_id:
                return p
        return None

    def create_profile(self, profile: CompanyProfile) -> CompanyProfile:
        now = datetime.now(timezone.utc).isoformat()
        if self.use_postgres:
            with self._get_postgres_conn() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        INSERT INTO company_profiles 
                        (client_id, company_name, industry, tagline_or_mission, products_and_services, target_audience, brand_voice_guidelines, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (client_id) DO UPDATE SET
                            company_name = EXCLUDED.company_name,
                            industry = EXCLUDED.industry,
                            tagline_or_mission = EXCLUDED.tagline_or_mission,
                            products_and_services = EXCLUDED.products_and_services,
                            target_audience = EXCLUDED.target_audience,
                            brand_voice_guidelines = EXCLUDED.brand_voice_guidelines;
                    """, (
                        profile.client_id,
                        profile.company_name,
                        profile.industry,
                        profile.tagline_or_mission,
                        json.dumps([p.model_dump() for p in profile.products_and_services]),
                        json.dumps(profile.target_audience.model_dump()),
                        json.dumps(profile.brand_voice_guidelines.model_dump()),
                        now
                    ))
                    conn.commit()
        elif self.use_supabase:
            self.supabase.table("company_profiles").insert({
                "client_id": profile.client_id,
                "company_name": profile.company_name,
                "industry": profile.industry,
                "tagline_or_mission": profile.tagline_or_mission,
                "products_and_services": json.dumps([p.model_dump() for p in profile.products_and_services]),
                "target_audience": json.dumps(profile.target_audience.model_dump()),
                "brand_voice_guidelines": json.dumps(profile.brand_voice_guidelines.model_dump()),
                "created_at": now
            }).execute()
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT OR REPLACE INTO company_profiles 
                    (client_id, company_name, industry, tagline_or_mission, products_and_services, target_audience, brand_voice_guidelines, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    profile.client_id,
                    profile.company_name,
                    profile.industry,
                    profile.tagline_or_mission,
                    json.dumps([p.model_dump() for p in profile.products_and_services]),
                    json.dumps(profile.target_audience.model_dump()),
                    json.dumps(profile.brand_voice_guidelines.model_dump()),
                    now
                ))
                conn.commit()
        return profile

    def update_profile(self, client_id: str, profile: CompanyProfile) -> Optional[CompanyProfile]:
        profile.client_id = client_id
        return self.create_profile(profile)

    def delete_profile(self, client_id: str) -> bool:
        if self.use_postgres:
            with self._get_postgres_conn() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("DELETE FROM company_profiles WHERE client_id = %s", (client_id,))
                    conn.commit()
        elif self.use_supabase:
            self.supabase.table("company_profiles").delete().eq("client_id", client_id).execute()
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM company_profiles WHERE client_id = ?", (client_id,))
                conn.commit()
        return True

    # ================= TREND QUEUE =================
    def create_queue_item(self, item: TrendQueueItem) -> TrendQueueItem:
        now = datetime.now(timezone.utc).isoformat()
        item.created_at = now
        item.updated_at = now
        if self.use_postgres:
            with self._get_postgres_conn() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        INSERT INTO trend_queue (id, client_id, source_type, source_url, file_path, status, progress_message, error_message, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (id) DO UPDATE SET
                            status = EXCLUDED.status,
                            progress_message = EXCLUDED.progress_message,
                            error_message = EXCLUDED.error_message,
                            updated_at = EXCLUDED.updated_at;
                    """, (
                        item.id,
                        item.client_id,
                        item.source_type,
                        item.source_url,
                        item.file_path,
                        item.status.value,
                        item.progress_message,
                        item.error_message,
                        item.created_at,
                        item.updated_at
                    ))
                    conn.commit()
        elif self.use_supabase:
            self.supabase.table("trend_queue").insert(item.model_dump()).execute()
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO trend_queue (id, client_id, source_type, source_url, file_path, status, progress_message, error_message, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    item.id,
                    item.client_id,
                    item.source_type,
                    item.source_url,
                    item.file_path,
                    item.status.value,
                    item.progress_message,
                    item.error_message,
                    item.created_at,
                    item.updated_at
                ))
                conn.commit()
        return item

    def get_queue_item(self, queue_id: str) -> Optional[TrendQueueItem]:
        if self.use_postgres:
            with self._get_postgres_conn() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT * FROM trend_queue WHERE id = %s", (queue_id,))
                    row = cursor.fetchone()
                    if row:
                        return TrendQueueItem(
                            id=row["id"],
                            client_id=row["client_id"],
                            source_type=row["source_type"],
                            source_url=row["source_url"],
                            file_path=row["file_path"],
                            status=QueueStatus(row["status"]),
                            progress_message=row["progress_message"],
                            error_message=row["error_message"],
                            created_at=str(row["created_at"]),
                            updated_at=str(row["updated_at"])
                        )
                    return None
        elif self.use_supabase:
            res = self.supabase.table("trend_queue").select("*").eq("id", queue_id).execute()
            if res.data:
                return TrendQueueItem(**res.data[0])
            return None
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM trend_queue WHERE id = ?", (queue_id,))
                row = cursor.fetchone()
                if row:
                    return TrendQueueItem(
                        id=row["id"],
                        client_id=row["client_id"],
                        source_type=row["source_type"],
                        source_url=row["source_url"],
                        file_path=row["file_path"],
                        status=QueueStatus(row["status"]),
                        progress_message=row["progress_message"],
                        error_message=row["error_message"],
                        created_at=row["created_at"],
                        updated_at=row["updated_at"]
                    )
                return None

    def update_queue_status(
        self,
        queue_id: str,
        status: QueueStatus,
        progress_message: str,
        error_message: Optional[str] = None
    ):
        now = datetime.now(timezone.utc).isoformat()
        if self.use_postgres:
            with self._get_postgres_conn() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        UPDATE trend_queue
                        SET status = %s, progress_message = %s, error_message = %s, updated_at = %s
                        WHERE id = %s
                    """, (status.value, progress_message, error_message, now, queue_id))
                    conn.commit()
        elif self.use_supabase:
            self.supabase.table("trend_queue").update({
                "status": status.value,
                "progress_message": progress_message,
                "error_message": error_message,
                "updated_at": now
            }).eq("id", queue_id).execute()
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE trend_queue
                    SET status = ?, progress_message = ?, error_message = ?, updated_at = ?
                    WHERE id = ?
                """, (status.value, progress_message, error_message, now, queue_id))
                conn.commit()

    # ================= CONTENT ANALYSIS =================
    def create_analysis(self, analysis: ContentAnalysis) -> ContentAnalysis:
        if not analysis.id:
            analysis.id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        analysis.created_at = now
        data = {
            "id": analysis.id,
            "queue_id": analysis.queue_id,
            "source_url_or_file": analysis.source_url_or_file,
            "duration_seconds": analysis.duration_seconds,
            "video_url": analysis.video_url,
            "frame_urls": json.dumps(analysis.frame_urls),
            "observable_claims": json.dumps(analysis.observable_claims),
            "transcript": analysis.transcript,
            "hook_analysis": json.dumps(analysis.hook_analysis.model_dump()),
            "narrative_structure": json.dumps(analysis.narrative_structure.model_dump()),
            "visual_storytelling": json.dumps(analysis.visual_storytelling.model_dump()),
            "psychological_formula": analysis.psychological_formula,
            "created_at": now
        }
        if self.use_postgres:
            with self._get_postgres_conn() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        INSERT INTO content_analysis 
                        (id, queue_id, source_url_or_file, duration_seconds, video_url, frame_urls, observable_claims, transcript, hook_analysis, narrative_structure, visual_storytelling, psychological_formula, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (id) DO UPDATE SET
                            duration_seconds = EXCLUDED.duration_seconds,
                            video_url = EXCLUDED.video_url,
                            frame_urls = EXCLUDED.frame_urls,
                            observable_claims = EXCLUDED.observable_claims,
                            transcript = EXCLUDED.transcript,
                            hook_analysis = EXCLUDED.hook_analysis,
                            narrative_structure = EXCLUDED.narrative_structure,
                            visual_storytelling = EXCLUDED.visual_storytelling,
                            psychological_formula = EXCLUDED.psychological_formula;
                    """, (
                        data["id"], data["queue_id"], data["source_url_or_file"], data["duration_seconds"],
                        data["video_url"], data["frame_urls"], data["observable_claims"],
                        data["transcript"], data["hook_analysis"], data["narrative_structure"],
                        data["visual_storytelling"], data["psychological_formula"], data["created_at"]
                    ))
                    conn.commit()
        elif self.use_supabase:
            self.supabase.table("content_analysis").insert(data).execute()
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO content_analysis 
                    (id, queue_id, source_url_or_file, duration_seconds, video_url, frame_urls, observable_claims, transcript, hook_analysis, narrative_structure, visual_storytelling, psychological_formula, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    data["id"], data["queue_id"], data["source_url_or_file"], data["duration_seconds"],
                    data["video_url"], data["frame_urls"], data["observable_claims"],
                    data["transcript"], data["hook_analysis"], data["narrative_structure"],
                    data["visual_storytelling"], data["psychological_formula"], data["created_at"]
                ))
                conn.commit()
        return analysis

    def get_analysis_by_queue(self, queue_id: str) -> Optional[ContentAnalysis]:
        if self.use_postgres:
            with self._get_postgres_conn() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT * FROM content_analysis WHERE queue_id = %s", (queue_id,))
                    row = cursor.fetchone()
                    if row:
                        row_dict = dict(row)
                        return ContentAnalysis(
                            id=row_dict["id"],
                            queue_id=row_dict["queue_id"],
                            source_url_or_file=row_dict["source_url_or_file"],
                            duration_seconds=row_dict["duration_seconds"],
                            video_url=row_dict.get("video_url"),
                            frame_urls=_clean_json_field(row_dict.get("frame_urls")) or [],
                            observable_claims=_clean_json_field(row_dict.get("observable_claims")) or [],
                            transcript=row_dict["transcript"],
                            hook_analysis=_clean_json_field(row_dict["hook_analysis"]),
                            narrative_structure=_clean_json_field(row_dict["narrative_structure"]),
                            visual_storytelling=_clean_json_field(row_dict["visual_storytelling"]),
                            psychological_formula=row_dict["psychological_formula"],
                            created_at=str(row_dict["created_at"])
                        )
                    return None
        elif self.use_supabase:
            res = self.supabase.table("content_analysis").select("*").eq("queue_id", queue_id).execute()
            if res.data:
                row = res.data[0]
                return ContentAnalysis(
                    id=row["id"],
                    queue_id=row["queue_id"],
                    source_url_or_file=row["source_url_or_file"],
                    duration_seconds=row["duration_seconds"],
                    video_url=row.get("video_url"),
                    frame_urls=_clean_json_field(row.get("frame_urls")) or [],
                    observable_claims=_clean_json_field(row.get("observable_claims")) or [],
                    transcript=row["transcript"],
                    hook_analysis=_clean_json_field(row["hook_analysis"]),
                    narrative_structure=_clean_json_field(row["narrative_structure"]),
                    visual_storytelling=_clean_json_field(row["visual_storytelling"]),
                    psychological_formula=row["psychological_formula"],
                    created_at=row["created_at"]
                )
            return None
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM content_analysis WHERE queue_id = ?", (queue_id,))
                row = cursor.fetchone()
                if row:
                    row_dict = dict(row)
                    return ContentAnalysis(
                        id=row_dict["id"],
                        queue_id=row_dict["queue_id"],
                        source_url_or_file=row_dict["source_url_or_file"],
                        duration_seconds=row_dict["duration_seconds"],
                        video_url=row_dict.get("video_url"),
                        frame_urls=_clean_json_field(row_dict.get("frame_urls")) or [],
                        observable_claims=_clean_json_field(row_dict.get("observable_claims")) or [],
                        transcript=row_dict["transcript"],
                        hook_analysis=_clean_json_field(row_dict["hook_analysis"]),
                        narrative_structure=_clean_json_field(row_dict["narrative_structure"]),
                        visual_storytelling=_clean_json_field(row_dict["visual_storytelling"]),
                        psychological_formula=row_dict["psychological_formula"],
                        created_at=row_dict["created_at"]
                    )
                return None

    # ================= CONTENT CONCEPTS =================
    def create_concept(self, concept: ContentConcept) -> ContentConcept:
        now = datetime.now(timezone.utc).isoformat()
        concept.created_at = now
        data = {
            "id": concept.id,
            "queue_id": concept.queue_id,
            "client_id": concept.client_id,
            "client_name": concept.client_name,
            "title": concept.title,
            "target_platform": concept.target_platform,
            "scenes": json.dumps([s.model_dump() for s in concept.scenes]),
            "platform_ideations": json.dumps(concept.platform_ideations.model_dump()),
            "qa_evaluation": json.dumps(concept.qa_evaluation.model_dump()),
            "source_formula": concept.source_formula,
            "created_at": now
        }
        if self.use_postgres:
            with self._get_postgres_conn() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        INSERT INTO content_concepts 
                        (id, queue_id, client_id, client_name, title, target_platform, scenes, platform_ideations, qa_evaluation, source_formula, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (id) DO UPDATE SET
                            client_id = EXCLUDED.client_id,
                            client_name = EXCLUDED.client_name,
                            title = EXCLUDED.title,
                            target_platform = EXCLUDED.target_platform,
                            scenes = EXCLUDED.scenes,
                            platform_ideations = EXCLUDED.platform_ideations,
                            qa_evaluation = EXCLUDED.qa_evaluation,
                            source_formula = EXCLUDED.source_formula;
                    """, (
                        data["id"], data["queue_id"], data["client_id"], data["client_name"], data["title"],
                        data["target_platform"], data["scenes"], data["platform_ideations"],
                        data["qa_evaluation"], data["source_formula"], data["created_at"]
                    ))
                    conn.commit()
        elif self.use_supabase:
            self.supabase.table("content_concepts").insert(data).execute()
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO content_concepts 
                    (id, queue_id, client_id, client_name, title, target_platform, scenes, platform_ideations, qa_evaluation, source_formula, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    data["id"], data["queue_id"], data["client_id"], data["client_name"], data["title"],
                    data["target_platform"], data["scenes"], data["platform_ideations"],
                    data["qa_evaluation"], data["source_formula"], data["created_at"]
                ))
                conn.commit()
        return concept

    def get_concepts(self, client_id: Optional[str] = None) -> List[ContentConcept]:
        if self.use_postgres:
            with self._get_postgres_conn() as conn:
                with conn.cursor() as cursor:
                    if client_id:
                        cursor.execute("SELECT * FROM content_concepts WHERE client_id = %s ORDER BY created_at DESC", (client_id,))
                    else:
                        cursor.execute("SELECT * FROM content_concepts ORDER BY created_at DESC")
                    rows = cursor.fetchall()
                    concepts = []
                    for row in rows:
                        concepts.append(ContentConcept(
                            id=row["id"],
                            queue_id=row["queue_id"],
                            client_id=row["client_id"],
                            client_name=row["client_name"],
                            title=row["title"],
                            target_platform=row["target_platform"],
                            scenes=_clean_json_field(row["scenes"]),
                            platform_ideations=_clean_json_field(row["platform_ideations"]),
                            qa_evaluation=_clean_json_field(row["qa_evaluation"]),
                            source_formula=row["source_formula"],
                            created_at=str(row["created_at"])
                        ))
                    return concepts
        elif self.use_supabase:
            query = self.supabase.table("content_concepts").select("*").order("created_at", desc=True)
            if client_id:
                query = query.eq("client_id", client_id)
            res = query.execute()
            concepts = []
            for row in res.data:
                concepts.append(ContentConcept(
                    id=row["id"],
                    queue_id=row["queue_id"],
                    client_id=row["client_id"],
                    client_name=row["client_name"],
                    title=row["title"],
                    target_platform=row["target_platform"],
                    scenes=_clean_json_field(row["scenes"]),
                    platform_ideations=_clean_json_field(row["platform_ideations"]),
                    qa_evaluation=_clean_json_field(row["qa_evaluation"]),
                    source_formula=row["source_formula"],
                    created_at=row["created_at"]
                ))
            return concepts
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                if client_id:
                    cursor.execute("SELECT * FROM content_concepts WHERE client_id = ? ORDER BY created_at DESC", (client_id,))
                else:
                    cursor.execute("SELECT * FROM content_concepts ORDER BY created_at DESC")
                rows = cursor.fetchall()
                concepts = []
                for row in rows:
                    concepts.append(ContentConcept(
                        id=row["id"],
                        queue_id=row["queue_id"],
                        client_id=row["client_id"],
                        client_name=row["client_name"],
                        title=row["title"],
                        target_platform=row["target_platform"],
                        scenes=_clean_json_field(row["scenes"]),
                        platform_ideations=_clean_json_field(row["platform_ideations"]),
                        qa_evaluation=_clean_json_field(row["qa_evaluation"]),
                        source_formula=row["source_formula"],
                        created_at=row["created_at"]
                    ))
                return concepts

    def get_concept(self, concept_id: str) -> Optional[ContentConcept]:
        if self.use_postgres:
            with self._get_postgres_conn() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT * FROM content_concepts WHERE id = %s", (concept_id,))
                    row = cursor.fetchone()
                    if row:
                        return ContentConcept(
                            id=row["id"],
                            queue_id=row["queue_id"],
                            client_id=row["client_id"],
                            client_name=row["client_name"],
                            title=row["title"],
                            target_platform=row["target_platform"],
                            scenes=_clean_json_field(row["scenes"]),
                            platform_ideations=_clean_json_field(row["platform_ideations"]),
                            qa_evaluation=_clean_json_field(row["qa_evaluation"]),
                            source_formula=row["source_formula"],
                            created_at=str(row["created_at"])
                        )
                    return None
        elif self.use_supabase:
            res = self.supabase.table("content_concepts").select("*").eq("id", concept_id).execute()
            if res.data:
                row = res.data[0]
                return ContentConcept(
                    id=row["id"],
                    queue_id=row["queue_id"],
                    client_id=row["client_id"],
                    client_name=row["client_name"],
                    title=row["title"],
                    target_platform=row["target_platform"],
                    scenes=_clean_json_field(row["scenes"]),
                    platform_ideations=_clean_json_field(row["platform_ideations"]),
                    qa_evaluation=_clean_json_field(row["qa_evaluation"]),
                    source_formula=row["source_formula"],
                    created_at=row["created_at"]
                )
            return None
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM content_concepts WHERE id = ?", (concept_id,))
                row = cursor.fetchone()
                if row:
                    return ContentConcept(
                        id=row["id"],
                        queue_id=row["queue_id"],
                        client_id=row["client_id"],
                        client_name=row["client_name"],
                        title=row["title"],
                        target_platform=row["target_platform"],
                        scenes=_clean_json_field(row["scenes"]),
                        platform_ideations=_clean_json_field(row["platform_ideations"]),
                        qa_evaluation=_clean_json_field(row["qa_evaluation"]),
                        source_formula=row["source_formula"],
                        created_at=row["created_at"]
                    )
                return None

    def delete_concept(self, concept_id: str) -> bool:
        """Safe cascade deletion: deletes concept and optionally cleans up analysis/queue."""
        concept = self.get_concept(concept_id)
        if not concept:
            return False

        queue_id = concept.queue_id

        if self.use_postgres:
            with self._get_postgres_conn() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("DELETE FROM content_concepts WHERE id = %s", (concept_id,))
                    if queue_id:
                        cursor.execute("DELETE FROM content_analysis WHERE queue_id = %s", (queue_id,))
                        cursor.execute("DELETE FROM trend_queue WHERE id = %s", (queue_id,))
                    conn.commit()
        elif self.use_supabase:
            self.supabase.table("content_concepts").delete().eq("id", concept_id).execute()
            if queue_id:
                self.supabase.table("content_analysis").delete().eq("queue_id", queue_id).execute()
                self.supabase.table("trend_queue").delete().eq("id", queue_id).execute()
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM content_concepts WHERE id = ?", (concept_id,))
                if queue_id:
                    cursor.execute("DELETE FROM content_analysis WHERE queue_id = ?", (queue_id,))
                    cursor.execute("DELETE FROM trend_queue WHERE id = ?", (queue_id,))
                conn.commit()
        return True


db = Database()
