import prisma from "@/lib/prisma";

export default async function Posts() {
  const posts = await prisma.post.findMany({
    include: {
      author: true,
    },
  });

  return (
    <div className="">
      <h1 className="">
        Posts
      </h1>
      <ul className="">
        {posts.map((post) => (
          <li key={post.id}>
            <span className="">{post.title}</span>
            <span className="">
              by {post.author.name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}