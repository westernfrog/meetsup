"use client";

import { useEffect, useState } from "react";
import { signInAnonymouslyUser, listenForAuthChanges } from "@/lib/auth";

export default function Home(params) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    listenForAuthChanges(setUser);
    if (!user) {
      signInAnonymouslyUser();
    }
  }, [user]);

  return (
    <>
      <h1>Hello</h1>
    </>
  );
}
