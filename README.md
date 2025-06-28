This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started (Local Development)

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Provide credentials**

   The backend uses the OpenAI provider via the Vercel AI SDK. Create a `.env.local` file at the project root with **your own** API key:

   ```bash
   OPENAI_API_KEY="sk-..."
   ```

3. **Run the dev server**

   ```bash
   npm run dev
   ```

   The app will be available at http://localhost:3000

4. **Chat**

   Type a message and you should see the assistant respond in real-time.

## Deployment

This repository is configured for instant deployment on [Vercel](https://vercel.com). Click the button below or run `vercel` from the CLI.

```text
▲
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
