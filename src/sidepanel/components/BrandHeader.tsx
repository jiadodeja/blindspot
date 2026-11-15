import { Eye } from 'lucide-react';

export default function BrandHeader() {
  return (
    <header className="brand-header">
      <div className="brand-content">
        <div className="brand-line"><span className="brand-eye"><Eye size={30} strokeWidth={2.8} /></span><span>Blind<span className="brand-gradient">spot</span></span><span className="brand-stars" aria-hidden="true">✦</span></div>
        <p>Step into a different perspective.<br />Build a more accessible web.</p>
      </div>
      <img className="header-art" src="/artwork/hero-landscape.webp" alt="" />
    </header>
  );
}
