import { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Button } from '@/components/ui/button';
import NiceAvatar from 'react-nice-avatar';
import { LogOut } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useAuth } from "@/context/AuthContext";


interface ProfileDropdownProps {
    className?: string;
}

export default function ProfileDropdown({
    className
}: ProfileDropdownProps) {
    const [open, setOpen] = useState(false);

    const { logout } = useAuth();

    const { user } = useSelector((state: RootState) => state.user);


    return (
        <div className={className}>
            <Popover.Root open={open} onOpenChange={setOpen}>
                <Popover.Trigger asChild>
                    <button
                        className="outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded-full transition-transform hover:scale-105 active:scale-95"
                        aria-label="Open profile menu"
                    >
                        <NiceAvatar
                            style={{ width: '40px', height: '40px' }}
                            className="rounded-full ring-2 ring-background"
                            {...{
                                sex: 'man',
                                faceColor: '#F9C9B6',
                                earSize: 'small',
                                eyeStyle: 'circle',
                                noseStyle: 'short',
                                mouthStyle: 'smile',
                                shirtStyle: 'hoody',
                                glassesStyle: 'none',
                                hairColor: '#000',
                                hairStyle: 'thick',
                                hatStyle: 'none',
                                hatColor: '#000',
                                shirtColor: '#92A1C6',
                                bgColor: '#FFE7C7',
                            }}
                        />
                    </button>
                </Popover.Trigger>

                <Popover.Portal>
                    <Popover.Content
                        side="bottom"
                        align="end"
                        sideOffset={5}
                        className="w-56 p-3 rounded-lg shadow-lg bg-card border animate-in fade-in-0 zoom-in-95"
                    >
                        <div className="space-y-3">
                            <div className="pb-3 border-b">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate text-right">
                                        {user?.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate text-right">
                                        {user?.username}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate text-right">
                                        {user?.role}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-sm text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={logout}
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Log Out
                                </Button>
                            </div>
                        </div>

                        <Popover.Arrow className="fill-current text-muted" />
                    </Popover.Content>
                </Popover.Portal>
            </Popover.Root>
        </div>
    );
}
