import { ChatView } from "./chat-view";

// 대화는 브라우저(localStorage)에 저장하므로 서버에서 불러올 데이터가 없다.
// 라우트 보호(인증)는 proxy.ts가 담당한다.
export default function ChatPage() {
  return <ChatView />;
}
