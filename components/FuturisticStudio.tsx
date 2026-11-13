'use client';

import React, { useRef, useState } from 'react';
import { DepthField } from '@/components/depth-field';
import { RefractedText } from '@/components/refracted-text';
import { FluidTyping } from '@/components/fluid-typing';
import { TopographicTerrain } from '@/components/topographic-terrain';
import { ShapePhysics } from '@/components/shape-physics';
import { FanGallery } from '@/components/fan-gallery';
import {
  SoapBubbleButton,
  SoapBubbleIconButton,
  SoapBubbleMaterial,
  SoapBubbleMenu,
  SoapBubbleSearch,
  SoapBubbleSlider,
  SoapBubbleToggle,
} from '@/components/soap-bubble';

interface FuturisticStudioProps {
  onNavigateToStage?: () => void;
  onNavigateToVisualizer?: () => void;
  onNavigateToShell?: () => void;
  onOpenCommandPalette?: () => void;
}

const DEPTH_IMAGES = [
  '/assets/images/futuristic_topographic_grid_1794577889494.jpg',
  '/assets/images/futuristic_fluid_prism_1794577891357.jpg',
  '/assets/images/futuristic_silicon_die_1794577889005.jpg',
  '/assets/images/futuristic_binary_monolith_1794577890982.jpg',
  '/assets/images/futuristic_glass_cube_1794577890207.jpg',
  '/assets/images/futuristic_orbital_tunnel_1794577891185.jpg',
];

const FAN_ITEMS = [
  {
    src: '/assets/images/futuristic_glass_cube_1794577890207.jpg',
    alt: 'Optical quartz cube refracting spectrum on a basalt pedestal',
  },
  {
    src: '/assets/images/futuristic_fluid_prism_1794577891357.jpg',
    alt: 'Cobalt and silver frosted glass lenses',
  },
  {
    src: '/assets/images/futuristic_silicon_die_1794577889005.jpg',
    alt: 'Optical silicon microprocessor wafer',
  },
  {
    src: '/assets/images/futuristic_orbital_tunnel_1794577891185.jpg',
    alt: 'Concentric brushed titanium orbital rings',
  },
  {
    src: '/assets/images/futuristic_topographic_grid_1794577889494.jpg',
    alt: 'Stepped ceramic and anodized steel topographic contour relief',
  },
];

export function FuturisticStudio({
  onNavigateToStage,
  onNavigateToVisualizer,
  onNavigateToShell,
  onOpenCommandPalette,
}: FuturisticStudioProps) {
  const page = useRef<HTMLDivElement>(null);
  const [wifi, setWifi] = useState(true);
  const [volume, setVolume] = useState(40);
  const [bubbleQuery, setBubbleQuery] = useState('');

  return (
    <div className="space-y-10">
      {/* 1. Spatial Perspective Depth Cloud */}
      <div className="rounded-xl overflow-hidden border border-slate-800">
        <DepthField
          images={DEPTH_IMAGES}
          textAlign="center"
          title={'Follow your\ncuriosity.'}
          subtitle=""
          buttonText="Explore components"
          buttonHref="#optical-refraction"
          secondaryButtonText="Learn more"
          secondaryButtonHref="#controls"
          fontFamily="'Plus Jakarta Sans', 'Inter Variable', sans-serif"
          background="#ffffff"
          color="#242120"
          fontSize="clamp(2rem, 5.5cqw, 5rem)"
          speed={5}
          entryBurst={70}
          entryDuration={2.8}
          entryDelay={0}
          scrollBoost={50}
          rotationSpeed={11}
          rotationDirection="counterclockwise"
          spread={12}
          depth={96}
          count={36}
          imageSize={3.8}
          imageRadius={0}
          paused={false}
          showText={true}
          imageOrigin="center"
          height="100svh"
        />
      </div>

      {/* 2. WebGL 2.0 Chromatic Refracted Display & Fluid Typing */}
      <section id="optical-refraction" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div
          className="lg:col-span-6 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center"
          style={{ background: '#050505', padding: '3rem', containerType: 'inline-size' }}
        >
          <RefractedText
            text="PRO"
            theme="dark"
            topColor="auto"
            bottomColor="auto"
            beamColor="auto"
            spectrumWarmColor="auto"
            spectrumMiddleColor="auto"
            spectrumCoolColor="auto"
            reveal={true}
            stagger={0.55}
            liftDuration={1.75}
            ease="power4.out"
            beamFollowsLift={false}
            animateBeam={true}
            openingDuration={6.9}
            duration={13.2}
            intensity={1.2}
            dispersion={1}
            colorIntensity={1}
            beamPosition={0.5}
            fixedBeam={false}
            paused={false}
            cursorMovesBeam={false}
            fontSize="400px"
            fontFamily="'ReactDrops Square Display', 'Arial Black', sans-serif"
            fontWeight={900}
            letterSpacing="normal"
            extraBold={2.25}
            fontHeight={80}
            cornerRounding={1}
          />
        </div>

        <div className="lg:col-span-6 rounded-xl overflow-hidden border border-slate-800 min-h-[340px]">
          <FluidTyping text={['Text over a fluid background.', 'Animated with React Drops.']} />
        </div>
      </section>

      {/* 3. Tactile Light Soap-Bubble Optical Controls */}
      <section
        id="controls"
        ref={page}
        className="page rounded-xl overflow-hidden border border-slate-200 p-8 sm:p-12"
        data-theme="light"
        style={{ background: '#f7f7f8', color: '#1b1d22' }}
      >
        <SoapBubbleMaterial
          backdrop={page}
          iridescence={0.5}
          oilCoverage={0.73}
          oilEdgeFade={2.33}
          clearCenter={0.57}
          windowLength={1.3}
          windowMargin={0.85}
          windowBend={0.75}
          windowSize={0.75}
          windowWidth={0.8}
          windowGradient={0.96}
          windowHead={0.7}
          windowTail={0.6}
          glintSize={1.65}
          glintIntensity={0}
          glintDistance={-0.45}
          glintHeight={0.65}
          windowIntensity={0.85}
          windowTwin={false}
          bottomShadeColor="#ffffff"
        >
          <div style={{ display: 'grid', gap: '1em', fontSize: 28, maxWidth: 680, margin: '0 auto' }}>
            <header style={{ display: 'flex', gap: '0.55em' }}>
              <SoapBubbleMenu
                round
                label="•••"
                triggerLabel="More"
                items={[
                  { label: 'Curriculum Stages', onSelect: () => onNavigateToStage?.() },
                  { label: 'Algorithms & Graphs', onSelect: () => onNavigateToVisualizer?.() },
                  { label: 'Wargame Shell', onSelect: () => onNavigateToShell?.() },
                ]}
              />
              <SoapBubbleIconButton
                aria-label="Open Command Search"
                style={{ marginLeft: 'auto' }}
                onClick={() => onOpenCommandPalette?.()}
              >
                📷
              </SoapBubbleIconButton>
              <SoapBubbleIconButton
                aria-label="Open Algorithm Visualizer"
                tint="rgb(52 199 89)"
                opacity={0.92}
                onClick={() => onNavigateToVisualizer?.()}
              >
                +
              </SoapBubbleIconButton>
            </header>
            <SoapBubbleSearch
              placeholder="Search"
              value={bubbleQuery}
              onChange={(e) => setBubbleQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && onOpenCommandPalette) {
                  onOpenCommandPalette();
                }
              }}
            />
            <SoapBubbleToggle checked={wifi} onCheckedChange={setWifi} aria-label="Wi-Fi" scale={2.75} />
            <SoapBubbleSlider value={volume} onValueChange={setVolume} label="Volume" from="#0a84ff" scale={3} />
            <SoapBubbleButton onClick={() => onNavigateToStage?.()}>Continue</SoapBubbleButton>
          </div>
        </SoapBubbleMaterial>
      </section>

      {/* 4. Sculpted Topographic Elevation Field */}
      <section className="rounded-xl overflow-hidden border border-slate-200 bg-white">
        <TopographicTerrain
          animateEntrance={true}
          scale={400}
          density={6}
          speed={1.5}
          distortion={2.4}
          lineWidth={0.5}
          opacity={0}
          seed={42}
          gradientDiffusion={0}
          surfaceColor="#ffffff"
          shadowColor="#737373"
          shadowAnimation="none"
          shadowCycleDuration={6}
          elevation={160}
          cameraTilt={38}
          cameraRotation={-20}
          cameraZoom={1}
          terraceSoftness={0.6}
          lightingBlend={0}
          lightDirection={315}
          lightIntensity={1}
          hover={0.45}
          hoverRadius={200}
          hoverFollow={0.16}
          hoverFade={0.8}
          grain={0.2}
          paused={false}
          backgroundColor="#ffffff"
          backgroundImage="none"
          gradientColors={[]}
          lineColor="#000000"
          accentColor="#000000"
          height={520}
        />
      </section>

      {/* 5. 3D-Volume Shape Physics Playground */}
      <section className="rounded-xl overflow-hidden border border-slate-800">
        <ShapePhysics height="100svh" />
      </section>

      {/* 6. Spring-Physics Architectural Artifact Fan */}
      <section className="rounded-xl border border-slate-800 bg-[#050811] py-12 px-4 overflow-hidden">
        <FanGallery
          items={FAN_ITEMS}
          cardWidth={162}
          aspectRatio={0.8}
          spacing={0.69}
          curve={0.14}
          tilt={14.5}
          lift={42}
          spread={0.2}
          stackFrom="left"
          speed={0.7}
          stagger={0.09}
          bounce={0.35}
          hoverSpeed={0.28}
          radius={18}
          entrance="stack"
          trigger="scroll"
          viewportStart={75}
          once={true}
          showTitle={false}
        />
      </section>
    </div>
  );
}
