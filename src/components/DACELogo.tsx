export default function DACELogo({ size = 40 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Shield background */}
            <path
                d="M50 5L90 20V55C90 75 70 92 50 97C30 92 10 75 10 55V20L50 5Z"
                fill="#1a237e"
            />
            {/* Inner shield */}
            <path
                d="M50 12L82 24V55C82 71 65 85 50 90C35 85 18 71 18 55V24L50 12Z"
                fill="#283593"
            />
            {/* DC letters */}
            <text
                x="50"
                y="52"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#FFD700"
                fontSize="28"
                fontWeight="900"
                fontFamily="sans-serif"
            >
                DC
            </text>
            {/* Yellow accent line */}
            <rect x="28" y="62" width="44" height="3" rx="1.5" fill="#FFD700" />
            {/* Book icon at bottom */}
            <path
                d="M40 70L50 67L60 70V80L50 77L40 80V70Z"
                fill="#FFD700"
                fillOpacity="0.8"
            />
        </svg>
    );
}
