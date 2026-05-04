-- Standalone draggable block for dynamic_banners carousel (below static Hero by default).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM homepage_sections WHERE key = 'promotion_banner') THEN
    UPDATE homepage_sections
      SET sort_order = sort_order + 1
    WHERE sort_order >= 1
      AND key <> 'hero';
    INSERT INTO homepage_sections ("id", "key", "label_th", "label_en", "sort_order", "is_active")
    VALUES (
      'hpsec_promotion_banner',
      'promotion_banner',
      'แบนเนอร์โปรโมชัน',
      'Promotion Banner',
      1,
      true
    );
  END IF;
END $$;
