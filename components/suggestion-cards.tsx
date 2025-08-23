"use client"

import { Card, CardContent } from "@/components/ui/card"

const suggestions = [
  "Suggest some places to visit in India.",
  "Explain the process of photosynthesis in simple terms.",
  "How do you create a responsive navbar using CSS and JavaScript?",
  "What are some essential skills for becoming a front-end developer?",
]

export default function SuggestionCards({ onPick = (t: string) => {} }: { onPick?: (t: string) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {suggestions.map((s, i) => (
        <button key={i} onClick={() => onPick(s)} className="text-left">
          <Card className="bg-slate-50 hover:bg-slate-100 transition-colors h-full">
            <CardContent className="p-4 text-slate-700 leading-6">{s}</CardContent>
          </Card>
        </button>
      ))}
    </div>
  )
}
