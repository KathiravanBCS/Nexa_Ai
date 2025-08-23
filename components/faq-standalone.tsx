"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function FaqStandalone() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">AI FAQ</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Find answers to common questions about how AI works, what it can do, and how to resolve typical issues.
      </p>
      <Accordion type="single" collapsible>
        <AccordionItem value="q1">
          <AccordionTrigger>How does AI work?</AccordionTrigger>
          <AccordionContent>
            AI models learn statistical patterns from data. They’re trained to minimize error on a task and then used to
            make predictions or generate outputs.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="q2">
          <AccordionTrigger>What are typical applications?</AccordionTrigger>
          <AccordionContent>
            Assistants, search, summarization, translation, code generation, recommendations, and image understanding
            are common applications.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="q3">
          <AccordionTrigger>Ethical considerations</AccordionTrigger>
          <AccordionContent>
            Consider privacy, fairness, transparency, bias, and misuse prevention. Keep a human in the loop for
            important decisions.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="q4">
          <AccordionTrigger>Troubleshooting</AccordionTrigger>
          <AccordionContent>
            If outputs are poor, clarify your prompt. For timeouts, retry or simplify inputs. Verify keys, file types,
            and sign-in status if features fail.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
