"use client";

import {
  Home,
  BookOpen,
  MessageSquare,
  UserRound,
  Menu,
  Clock,
  Bookmark,
  Users,
  Gamepad2,
  ShieldAlert,
  Settings,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

const NavItem = ({
  icon: Icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ComponentType<any>;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center w-16 h-14 transition-all cursor-pointer",
      active
        ? "text-primary"
        : "text-foreground/60 hover:text-foreground"
    )}
  >
    <div className={cn("p-1.5 rounded-full", active && "bg-primary/20")}>
      <Icon size={20} />
    </div>
    <span className="text-[10px] mt-0.5 font-medium">{label}</span>
  </button>
);

const DrawerItem = ({
  icon: Icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ComponentType<any>;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-4 w-full p-4 rounded-xl transition-all cursor-pointer text-left",
      active
        ? "bg-primary/20 text-primary font-medium"
        : "text-foreground/80 hover:bg-foreground/5"
    )}
  >
    <Icon size={24} />
    <span className="text-base">{label}</span>
  </button>
);

export default function MobileNav() {
  const router = useRouter();
  const path = usePathname();
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on path change
  useEffect(() => {
    setDrawerOpen(false);
  }, [path]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; }
  }, [drawerOpen]);

  const getActiveItem = () => {
    if (path === "/") return "home";
    if (path.startsWith("/books")) return "books";
    if (path.startsWith("/history")) return "history";
    if (path.startsWith("/bookmarks")) return "bookmarks";
    if (path.startsWith("/messages")) return "messages";
    if (path.startsWith("/community")) return "community";
    if (path.startsWith("/playground")) return "playground";
    if (path.startsWith("/profile")) return "profile";
    if (path.startsWith("/admin")) return "admin";
    if (path.startsWith("/settings")) return "settings";
    return "";
  };

  const handleNav = (route: string) => {
    router.push(route);
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 h-[68px] bg-background border-t border-border flex items-center justify-around z-50 md:hidden pb-safe">
        <NavItem
          icon={Home}
          label="Home"
          active={getActiveItem() === "home"}
          onClick={() => handleNav("/")}
        />
        <NavItem
          icon={BookOpen}
          label="Books"
          active={getActiveItem() === "books"}
          onClick={() => handleNav("/books")}
        />
        <NavItem
          icon={Gamepad2}
          label="Play"
          active={getActiveItem() === "playground"}
          onClick={() => handleNav("/playground")}
        />
        <NavItem
          icon={MessageSquare}
          label="Chat"
          active={getActiveItem() === "messages"}
          onClick={() => handleNav("/messages")}
        />
        <NavItem
          icon={Menu}
          label="Menu"
          active={drawerOpen || ["history", "bookmarks", "community", "profile", "admin", "settings"].includes(getActiveItem())}
          onClick={() => setDrawerOpen(true)}
        />
      </div>

      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] md:hidden"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed bottom-0 left-0 right-0 h-[85vh] bg-background border-t border-border rounded-t-3xl z-[70] flex flex-col md:hidden shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <Image src="/novelnest.png" width={32} height={32} alt="Logo" />
                  <span className="font-playfair font-bold text-xl">NovelNest</span>
                </div>
                <button 
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 rounded-full bg-foreground/5 hover:bg-foreground/10 text-foreground"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-24">
                <DrawerItem
                  icon={UserRound}
                  label="Profile"
                  active={getActiveItem() === "profile"}
                  onClick={() => handleNav("/profile")}
                />
                <DrawerItem
                  icon={Clock}
                  label="History"
                  active={getActiveItem() === "history"}
                  onClick={() => handleNav("/history")}
                />
                <DrawerItem
                  icon={Bookmark}
                  label="Bookmarks"
                  active={getActiveItem() === "bookmarks"}
                  onClick={() => handleNav("/bookmarks")}
                />
                <DrawerItem
                  icon={Users}
                  label="Community"
                  active={getActiveItem() === "community"}
                  onClick={() => handleNav("/community")}
                />
                
                <div className="h-px bg-border/50 my-4" />
                
                {(user?.role === 'admin' || user?.role === 'owner') && (
                  <DrawerItem
                    icon={ShieldAlert}
                    label="Admin Panel"
                    active={getActiveItem() === "admin"}
                    onClick={() => handleNav("/admin")}
                  />
                )}
                <DrawerItem
                  icon={Settings}
                  label="Settings"
                  active={getActiveItem() === "settings"}
                  onClick={() => handleNav("/settings")}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
