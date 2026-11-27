/** Round emoji avatar tinted with the kid's color. */
export default function Avatar({ kid, size = 'md' }) {
  return (
    <span className={`avatar avatar-${size}`} style={{ '--kid': kid.color }} aria-hidden="true">
      {kid.avatar}
    </span>
  );
}
