import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Command, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Clock } from "lucide-react"
import { useState } from "react"

const defaultTimes = Array.from({ length: 48 }, (_, i) => {
    const hour = String(Math.floor(i / 2)).padStart(2, "0")
    const minute = i % 2 === 0 ? "00" : "30"
    return `${hour}:${minute}`
})

export default function TimeSelect({ value, onChange }: { value?: string; onChange: (val: string) => void }) {
    const [open, setOpen] = useState(false)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className="w-full justify-start bg-white/5 text-white border-white/10 hover:bg-white/10"
                >
                    <Clock className="mr-2 h-4 w-4 opacity-50" />
                    {value || "Select time"}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[200px] bg-black border-white/10 text-white max-h-60 overflow-y-auto">
                <Command>
                    <CommandInput placeholder="Search time..." />
                    <CommandList>
                        {defaultTimes.map((time) => (
                            <CommandItem
                                key={time}
                                onSelect={() => {
                                    onChange(time)
                                    setOpen(false)
                                }}
                            >
                                {time}
                            </CommandItem>
                        ))}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
