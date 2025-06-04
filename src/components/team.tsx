import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import MinhAnh from '@/images/minh-anh.png'
import DinhDuong from '@/images/dinh-duong.png'
import AnhKiet from '@/images/anh-kiet.png'

const members = [
    {
        name: 'Minh Anh',
        role: 'Founder - CEO',
        avatar: MinhAnh,
        link: '#',
    },
    {
        name: 'Dinh Duong',
        role: 'Co-Founder - CTO',
        avatar: DinhDuong,
        link: '#',
    },
    {
        name: 'Anh Kiet',
        role: 'Co-Founder - DevOps Engineer',
        avatar: AnhKiet,
        link: '#',
    },
    {
        name: 'Henry Lee',
        role: 'UX Engeneer',
        avatar: 'https://alt.tailus.io/images/team/member-four.webp',
        link: '#',
    },
    {
        name: 'Ava Williams',
        role: 'Interaction Designer',
        avatar: 'https://alt.tailus.io/images/team/member-five.webp',
        link: '#',
    },
]

export default function TeamSection() {
    const numMembers = members.length;

    const memberListContainerClasses = [
        "grid",
        "gap-x-6",
        "gap-y-12",
        "sm:grid-cols-2",
        numMembers === 5 ? "lg:grid-cols-6" : "lg:grid-cols-3",
    ].join(" ");

    // Animation variants for image
    const imageVariants = {
        initial: {
            filter: "grayscale(100%)",
            height: "24rem", // h-96
        },
        hover: {
            filter: "grayscale(0%)",
            height: "22.5rem", // group-hover:h-[22.5rem]
        },
    };

    // Animation variants for text elements (role and link)
    const textVariants = {
        initial: {
            opacity: 0,
            y: 24, // translate-y-6
        },
        hover: {
            opacity: 1,
            y: 0,
        },
    };

    return (
        <section className="bg-gray-50 py-16 md:py-32 dark:bg-transparent">
            <div className="mx-auto max-w-5xl border-t px-6">
                <span className="text-caption -ml-6 -mt-3.5 block w-max bg-gray-50 px-6 dark:bg-gray-950">Team</span>
                <div className="mt-12 gap-4 sm:grid sm:grid-cols-2 md:mt-24">
                    <div className="sm:w-2/5">
                        <h2 className="text-3xl font-bold sm:text-4xl">Our dream team</h2>
                    </div>
                    <div className="mt-6 sm:mt-0">
                        <p>During the working process, we perform regular fitting with the client because he is the only person who can feel whether a new suit fits or not.</p>
                    </div>
                </div>
                <div className="mt-12 md:mt-24">
                    <div className={memberListContainerClasses}>
                        {members.map((member, index) => {
                            let itemClasses = "group overflow-hidden";
                            if (numMembers === 5) {
                                if (index < 3) {
                                    itemClasses += " lg:col-span-2";
                                } else if (index === 3) { // 4th member
                                    itemClasses += " lg:col-start-2 lg:col-span-2";
                                } else if (index === 4) { // 5th member
                                    itemClasses += " lg:col-start-4 lg:col-span-2";
                                }
                            }
                            return (
                                <motion.div
                                    key={index}
                                    className={itemClasses}
                                    initial="initial"
                                    whileHover="hover"
                                >
                                    <motion.img
                                        className="w-full rounded-md object-cover object-top"
                                        src={member.avatar}
                                        alt="team member"
                                        width="826"
                                        height="1239"
                                        variants={imageVariants}
                                        transition={{ duration: 0.5 }}
                                    />
                                    <div className="px-2 pt-2 sm:pb-0 sm:pt-4">
                                        <div className="flex justify-between">
                                            <h3 className="text-title text-base font-medium transition-all duration-500 group-hover:tracking-wider">{member.name}</h3>
                                            <span className="text-xs">_0{index + 1}</span>
                                        </div>
                                        <div className="mt-1 flex items-center justify-between">
                                            <motion.span
                                                className="text-[#99BC85] inline-block text-sm"
                                                variants={textVariants}
                                                transition={{ duration: 0.3, delay: 0.1 }}
                                            >
                                                {member.role}
                                            </motion.span>
                                            <motion.div
                                                variants={textVariants}
                                                transition={{ duration: 0.5, delay: 0.2 }}
                                            >
                                                <Link
                                                    to={member.link}
                                                    className="group-hover:text-primary-600 dark:group-hover:text-primary-400 inline-block text-sm tracking-wide hover:underline"
                                                >
                                                    {' '}
                                                    Linktree
                                                </Link>
                                            </motion.div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    )
}
