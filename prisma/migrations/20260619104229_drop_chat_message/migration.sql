-- 채팅 기록은 브라우저(localStorage)에 저장하도록 변경 — DB 테이블 제거.
-- DropForeignKey
ALTER TABLE "ChatMessage" DROP CONSTRAINT IF EXISTS "ChatMessage_userId_fkey";

-- DropTable
DROP TABLE IF EXISTS "ChatMessage";
