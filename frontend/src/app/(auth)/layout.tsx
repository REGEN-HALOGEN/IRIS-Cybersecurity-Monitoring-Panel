export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-transparent">
      <div className="w-full max-w-[400px] p-4">
        {children}
      </div>
    </div>
  );
}