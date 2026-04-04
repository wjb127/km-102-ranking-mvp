import EventDetailClient from "./event-detail-client";

/** 이벤트 상세 페이지 - 서버 컴포넌트 래퍼 */
interface EventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params;
  return <EventDetailClient id={id} />;
}
