import CategoryDetailClient from "@/components/category-detail";

/** 카테고리 상세 페이지 - 서버 컴포넌트 래퍼 */
interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  return <CategoryDetailClient slug={slug} />;
}
