"use client";

import { useState } from "react";
import Link from "next/link";
import { Clipboard, MessageSquarePlus } from "lucide-react";

export interface DemoScenarioCardProps {
  title: string;
  goal: string;
  prompt: string;
  href?: string;
  inspect?: string[];
  links?: Array<{ label: string; href: string }>;
}

export function DemoScenarioCard({ title, goal, prompt, href, inspect = [], links = [] }: DemoScenarioCardProps) {
  const [copied, setCopied] = useState(false);
  const chatHref = href ?? `/chat?prefill=${encodeURIComponent(prompt)}`;

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className="flex min-h-[250px] flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{goal}</p>
        {prompt ? (
          <blockquote className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700">
            {prompt}
          </blockquote>
        ) : null}
        {inspect.length ? (
          <div className="mt-4 rounded-md border border-teal-100 bg-teal-50/60 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-focus">What to inspect</p>
            <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-700">
              {inspect.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {links.length ? (
          <div className="mt-4 space-y-1.5">
            {links.map((item) => (
              <Link key={item.href} className="block text-sm font-medium text-focus hover:underline" href={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
      {prompt ? (
        <div className="mt-5 flex flex-wrap gap-2">
          <button className="btn-secondary" type="button" onClick={copyPrompt}>
            <Clipboard size={15} />
            {copied ? "Copied" : "Copy prompt"}
          </button>
          <Link className="btn-primary" href={chatHref}>
            <MessageSquarePlus size={15} />
            Open Chat
          </Link>
        </div>
      ) : null}
    </article>
  );
}
