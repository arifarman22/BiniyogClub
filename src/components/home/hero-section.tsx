export function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden bg-background h-[50vh] sm:h-[65vh] md:h-[75vh] lg:h-[82vh] max-h-[850px]">
      <video
        src="/logo with money.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
    </section>
  );
}
