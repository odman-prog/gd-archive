ALTER TABLE contents DROP CONSTRAINT IF EXISTS contents_category_check;
ALTER TABLE contents ADD CONSTRAINT contents_category_check CHECK (category IN ('기사', '에세이', '인터뷰', '시/수필', '독서감상문', '수행평가', '교사의 서재', '도서관', '광덕 위클리', '입시 웹툰'));
