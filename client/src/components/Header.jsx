import { MessageCircleHeartIcon, UsersIcon } from "lucide-react";
import Link from "next/link";

export default function Header(params) {
  return (
    <>
      <header className="col-span-12 row-span-2 flex items-center justify-between px-4 rounded-lg bg-primary ring-1 ring-gray-200 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-1.5 flex-shrink-0">
          <MessageCircleHeartIcon
            size={24}
            strokeWidth={1.5}
            className="stroke-blue-500 fill-blue-100"
          />
          <span className="font-medium">Meetsup</span>
          <span className="sr-only">Meetsup</span>
        </Link>
        <nav></nav>
      </header>
    </>
  );
}
