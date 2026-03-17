-- CreateTable
CREATE TABLE "Class" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "class_id" INTEGER NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "subject_id" INTEGER NOT NULL,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Page" (
    "id" SERIAL NOT NULL,
    "chapter_id" INTEGER NOT NULL,
    "page_order" INTEGER NOT NULL,
    "content_text" TEXT NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageChunk" (
    "id" SERIAL NOT NULL,
    "page_id" INTEGER NOT NULL,
    "chapter_id" INTEGER NOT NULL,
    "subject_id" INTEGER NOT NULL,
    "class_id" INTEGER NOT NULL,
    "chunk_text" TEXT NOT NULL,
    "embedding" vector NOT NULL,

    CONSTRAINT "PageChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Subject_class_id_idx" ON "Subject"("class_id");

-- CreateIndex
CREATE INDEX "Chapter_subject_id_idx" ON "Chapter"("subject_id");

-- CreateIndex
CREATE INDEX "Page_chapter_id_idx" ON "Page"("chapter_id");

-- CreateIndex
CREATE INDEX "PageChunk_page_id_idx" ON "PageChunk"("page_id");

-- CreateIndex
CREATE INDEX "PageChunk_chapter_id_idx" ON "PageChunk"("chapter_id");

-- CreateIndex
CREATE INDEX "PageChunk_subject_id_idx" ON "PageChunk"("subject_id");

-- CreateIndex
CREATE INDEX "PageChunk_class_id_idx" ON "PageChunk"("class_id");

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageChunk" ADD CONSTRAINT "PageChunk_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;
