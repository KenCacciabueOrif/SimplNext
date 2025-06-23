import prisma from "@/lib/prisma";

export default async function Posts() {
  const posts = await prisma.post.findMany({
    include: {
      author: true,
    },
  });

  return (
    <div className="border flex flex-col flex-auto mx-7">
      <ul className="border flex flex-col flex-auto">
        {posts.map((post) => (
          <li key={post.id} className="border flex flex-col max-h-70 min-h-30">
            <span className="text-xl font-bold text-center py-5">{post.title}</span>
            <span className="text-base text-center flex-auto">
              by {post.content}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}