interface BrandLogoProps {
  size?: 'auth' | 'sidebar' | 'compact';
  className?: string;
}

const sizes = {
  auth: 'h-24 w-24 sm:h-28 sm:w-28 lg:h-32 lg:w-32',
  sidebar: 'h-16 w-16',
  compact: 'h-11 w-11',
};

export default function BrandLogo({ size = 'sidebar', className = '' }: BrandLogoProps) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden ${sizes[size]} ${className}`}
      aria-hidden="true"
    >
      <img
        src="/logo.png"
        alt=""
        className="absolute left-1/2 top-1/2 h-auto w-full max-w-none -translate-x-1/2 -translate-y-1/2"
      />
    </div>
  );
}
