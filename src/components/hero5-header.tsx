import { Logo } from "./logo";
import { BookOpen, Menu, Shield, UserCircle, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import React from "react";
import { cn } from "@/utils/css";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import windowIcon from "@/images/xt2uot9yhpma85juvk.svg";
import { UserButton, useAuth } from "@clerk/clerk-react";

const menuItems = [
  { name: "FEATURES", href: "/#link" },
  { name: "BLOG", href: "/#link" },
  { name: "PRICING", href: "/pricing" },
  { name: "ABOUT", href: "/#link" },
];

export const HeroHeader = () => {
  const [menuState, setMenuState] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const { isSignedIn } = useAuth();

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return (
    <header>
      <nav
        data-state={menuState ? "active" : undefined}
        className="fixed z-20 w-full px-2"
      >
        <div
          className={cn(
            "mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12",
            isScrolled &&
              "bg-background/50 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5"
          )}
        >
          <AnimatePresence>
            {menuState && (
              <motion.div
                layout
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{
                  height: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
                  opacity: { duration: 0.25, delay: 0.1 },
                }}
                className="absolute top-0 left-0 right-0 -z-10 bg-background/50 backdrop-blur-lg border rounded-2xl overflow-hidden lg:hidden"
              />
            )}
          </AnimatePresence>
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4 overflow-hidden">
            <div className="flex w-full justify-between lg:w-auto">
              <Link
                to="/"
                aria-label="home"
                className="flex items-center space-x-2"
              >
                <Logo />
              </Link>

              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState ? "Close Menu" : "Open Menu"}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
              >
                <Menu
                  data-state={menuState ? "active" : undefined}
                  className="m-auto size-6 duration-200 data-[state=active]:rotate-180 data-[state=active]:scale-0 data-[state=active]:opacity-0"
                />
                <X
                  data-state={menuState ? "active" : undefined}
                  className="absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200 data-[state=active]:rotate-0 data-[state=active]:scale-100 data-[state=active]:opacity-100"
                />
              </button>
            </div>

            <div className="absolute inset-0 m-auto hidden size-fit lg:block">
              <ul className="flex gap-8 text-md font-publica-sans">
                {menuItems.map((item, index) => (
                  <li key={index}>
                    <Link
                      to={item.href}
                      className="text-foreground hover:text-primary block duration-150"
                    >
                      <span>{item.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <AnimatePresence>
              {menuState && (
                <motion.div
                  initial={{ opacity: 0, y: -300 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -300 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(
                    "bg-background mb-6 w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent",
                    "block",
                    "lg:hidden"
                  )}
                >
                  <div className="lg:hidden">
                    <ul className="space-y-6 text-base">
                      {menuItems.map((item, index) => (
                        <li key={index}>
                          <Link
                            to={item.href}
                            className="text-foreground hover:text-primary block duration-150"
                          >
                            <span>{item.name}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-row gap-3 justify-end items-center font-publica-sans">
                    {isSignedIn ? (
                      <UserButton
                        showName
                        afterSignOutUrl="/"
                        appearance={{
                          elements: {
                            userButtonAvatarBox: "h-11 w-11",
                          },
                        }}
                      />
                    ) : (
                      <>
                        <Button asChild variant="outline" size="default">
                          <Link to="/sign-in">
                            <span>Login</span>
                          </Link>
                        </Button>
                        <Button asChild size="default">
                          <Link to="/sign-up">
                            <span>Sign Up</span>
                          </Link>
                        </Button>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="hidden lg:flex lg:w-fit lg:gap-4 font-publica-sans">
              {isSignedIn ? (
                <UserButton
                  showName
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "h-11 w-11",
                    },
                  }}
                >
                  <UserButton.MenuItems>
                    <UserButton.Link
                      href="/journal/user-profile"
                      label="My Profile"
                      labelIcon={<UserCircle size={16} />}
                    />
                    <UserButton.Link
                      href="/journal"
                      label="Journal"
                      labelIcon={<BookOpen size={16} />}
                    />
                    <UserButton.Link
                      href="/user/security"
                      label="Security"
                      labelIcon={<Shield size={16} />}
                    />
                  </UserButton.MenuItems>
                </UserButton>
              ) : (
                <>
                  <Button
                    asChild
                    variant="outline"
                    size="default"
                    className={cn(isScrolled && "lg:hidden")}
                  >
                    <Link to="/sign-in">
                      <span>Login</span>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="default"
                    className={cn(isScrolled && "lg:hidden")}
                  >
                    <Link to="/sign-up">
                      <img
                        src={windowIcon}
                        alt="Cube Icon"
                        className="h-5 w-5"
                      />
                      <span>Download</span>
                    </Link>
                  </Button>
                </>
              )}
              {isScrolled && !isSignedIn && (
                <Button asChild size="default" className="lg:inline-flex">
                  <Link to="/sign-up">
                    <span>Get Started</span>
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};
