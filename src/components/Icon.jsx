export default function Icon({ name = "cross", size = 22 }) {
  const paths = {
    cross: <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" />,
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    shield: (
      <>
        <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    pill: (
      <>
        <path d="m6 12 6-6a4.24 4.24 0 0 1 6 6l-6 6a4.24 4.24 0 0 1-6-6Z" />
        <path d="m9 9 6 6" />
      </>
    ),
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    eye: (
      <>
        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    wallet: (
      <>
        <path d="M4 6h15v14H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h13v2M19 10h3v6h-7v-6z" />
        <path d="M18 13h1" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.cross}
    </svg>
  );
}
