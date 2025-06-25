import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function Post({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id: parseInt(id) },
    include: {
      author: true,
    },
  });

  if (!post) {
    notFound();
  }

  return (
    <div className="">
      <article className="">
        <h1 className="">{post.title}</h1>
        <p className="">by {post.author.name}</p>
        <div className="">
          {post.content || "No content available."}
        </div>
      </article>
    </div>
  );
}