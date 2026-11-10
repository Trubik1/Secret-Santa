# Project & User Design Guidelines

1. **Anti-Slop Visual Standards**:
   - Light Mode must be crisp, high-contrast, Apple HIG quality: dark readable text (`text-zinc-900`), clean borders (`border-zinc-200`), solid accent buttons, neutral gray secondary elements.
   - Dark Mode: deep OLED `#0d0d0f`, refined surface cards `#17171a`, elegant subtle borders `#34252f`, noble rose accent `#c4457b`.
   - Never use cartoon stickers overlapping text or profiles.

2. **Liquid Glass & Floating Navigation Docks**:
   - Navigation panels and floating docks use the **Liquid Glass** effect:
     `backdrop-blur-2xl bg-white/70 dark:bg-[#121214]/75 border border-white/30 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.18)] rounded-full`.
   - Active segmented item uses frosted inner glow (`bg-white/15 backdrop-blur-md border border-white/20 shadow-inner`).

3. **Fluid iOS Physics & Gestures**:
   - Bottom sheets and detail cards must support **Swipe down on header / handle to dismiss** (`drag-to-dismiss` gesture with touch tracking).
   - Enter animation: fluid water-emergence / droplet morph (smooth spring physics, not stiff slide).

4. **Persistent Client State**:
   - Theme preference (Dark / Light) must always be saved and read from client-side `localStorage` immediately on boot, so reopening the Mini App never loses user theme choice.

5. **Clean Currency & Text**:
   - Strictly display the single active currency chosen by the user. Do not show secondary currencies in parentheses.
   - Share invitation text must be concise and clickable: "Мой вишлист 🎁 ➔ [ссылка]", never verbose price lists.
