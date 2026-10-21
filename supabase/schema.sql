-- ==============================================================================
-- CƠ SỞ DỮ LIỆU QUẢN LÝ THIẾT BỊ MẮT MỘT MÍ MEDIA
-- Supabase Postgres Schema + RLS + Triggers + Seed Data
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'manager', 'staff');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'locked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE asset_status AS ENUM ('available', 'in_use', 'pending_transfer', 'alert');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE alert_reason AS ENUM ('overdue', 'damaged', 'lost', 'maintenance');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transfer_type AS ENUM ('borrow', 'return', 'peer_transfer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transfer_status AS ENUM ('pending', 'completed', 'rejected', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. BẢNG NHÂN SỰ (PROFILES)
-- Liên kết với auth.users của Supabase
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'staff',
    status user_status NOT NULL DEFAULT 'active',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. BẢNG THIẾT BỊ (ASSETS)
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- Ví dụ: MMM-CAM-001, MMM-LENS-002
    name TEXT NOT NULL,        -- Ví dụ: Sony Alpha A7 IV
    category TEXT NOT NULL,    -- camera, lens, lighting, computer_storage, audio, accessory, gimbal_tripod
    model TEXT,
    serial_number TEXT,
    location TEXT NOT NULL DEFAULT 'Kho Studio Tầng 1',
    image_url TEXT,
    manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Người phụ trách thiết bị
    current_holder_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Người đang giữ hiện tại
    status asset_status NOT NULL DEFAULT 'available',
    alert_reason alert_reason,
    due_date TIMESTAMPTZ, -- Hạn trả dự kiến
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. BẢNG GIAO DỊCH MƯỢN TRẢ / BÀN GIAO (TRANSFERS)
CREATE TABLE IF NOT EXISTS public.transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    from_user_id UUID NOT NULL REFERENCES public.profiles(id), -- Người giao
    to_user_id UUID NOT NULL REFERENCES public.profiles(id),   -- Người nhận
    transfer_type transfer_type NOT NULL, -- borrow / return / peer_transfer
    status transfer_status NOT NULL DEFAULT 'pending',
    due_date TIMESTAMPTZ,
    location_after TEXT,
    
    -- Tình trạng khi giao
    giver_notes TEXT,
    giver_photos JSONB DEFAULT '[]'::jsonb, -- Danh sách link ảnh hiện trạng lúc giao
    
    -- Tình trạng khi nhận
    receiver_notes TEXT,
    receiver_photos JSONB DEFAULT '[]'::jsonb, -- Danh sách link ảnh lúc nhận
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    confirmed_at TIMESTAMPTZ,
    rejection_reason TEXT
);

-- 6. BẢNG ĐỢT KIỂM KÊ (AUDIT SESSIONS)
CREATE TABLE IF NOT EXISTS public.audit_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    created_by_id UUID REFERENCES public.profiles(id),
    status TEXT NOT NULL DEFAULT 'in_progress', -- in_progress, completed
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ
);

-- 7. BẢNG CHI TIẾT KIỂM KÊ TỪNG MÓN (AUDIT ITEMS)
CREATE TABLE IF NOT EXISTS public.audit_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.audit_sessions(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    scanned_by_id UUID REFERENCES public.profiles(id),
    
    expected_holder_id UUID REFERENCES public.profiles(id),
    actual_holder_id UUID REFERENCES public.profiles(id),
    
    expected_location TEXT NOT NULL,
    actual_location TEXT NOT NULL,
    
    expected_status asset_status NOT NULL,
    actual_status asset_status NOT NULL,
    
    has_discrepancy BOOLEAN NOT NULL DEFAULT false,
    discrepancy_details TEXT,
    notes TEXT
);

-- 8. INDEXES ĐỂ TỐI ƯU HIỆU NĂNG
CREATE INDEX IF NOT EXISTS idx_assets_code ON public.assets(code);
CREATE INDEX IF NOT EXISTS idx_assets_status ON public.assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_current_holder ON public.assets(current_holder_id);
CREATE INDEX IF NOT EXISTS idx_transfers_asset ON public.transfers(asset_id);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON public.transfers(status);
CREATE INDEX IF NOT EXISTS idx_transfers_to_user ON public.transfers(to_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_items_session ON public.audit_items(session_id);

-- 9. TRIGGERS TỰ ĐỘNG CẬP NHẬT updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_assets_updated_at ON public.assets;
CREATE TRIGGER trigger_assets_updated_at
    BEFORE UPDATE ON public.assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_items ENABLE ROW LEVEL SECURITY;

-- Chính sách đọc cho người dùng đã đăng nhập và đang active
CREATE POLICY "Cho phép người dùng active đọc hồ sơ" ON public.profiles
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Admin & Manager có quyền sửa hồ sơ nhân sự" ON public.profiles
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager') AND status = 'active'
        )
    );

CREATE POLICY "Cho phép đọc toàn bộ thiết bị" ON public.assets
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Admin & Manager có quyền tạo/sửa thiết bị" ON public.assets
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager') AND status = 'active'
        )
    );

CREATE POLICY "Mọi nhân sự active có thể xem giao dịch mượn trả" ON public.transfers
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Nhân sự active có thể tạo giao dịch mượn trả" ON public.transfers
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = from_user_id AND
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'active')
    );

CREATE POLICY "Người nhận hoặc Admin/Manager được xác nhận giao dịch" ON public.transfers
    FOR UPDATE TO authenticated
    USING (
        auth.uid() = to_user_id OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
    );

-- Storage buckets setup
INSERT INTO storage.buckets (id, name, public) 
VALUES ('asset-images', 'asset-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('condition-photos', 'condition-photos', true)
ON CONFLICT (id) DO NOTHING;
