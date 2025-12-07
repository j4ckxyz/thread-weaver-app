import React from 'react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="min-h-screen w-full bg-black text-white relative overflow-hidden flex flex-col items-center">
            {/* Background Gradients/Orbs */}
            <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-900 rounded-full blur-[120px] opacity-20 pointer-events-none animate-pulse" />
            <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900 rounded-full blur-[120px] opacity-20 pointer-events-none" />

            {/* Main Content Container */}
            <main className="z-10 w-full max-w-7xl px-4 py-8 flex flex-col items-center gap-8 min-h-screen">
                {children}
            </main>
        </div>
    );
};
