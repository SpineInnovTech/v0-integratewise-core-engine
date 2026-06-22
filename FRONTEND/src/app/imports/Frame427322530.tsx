import clsx from "clsx";
import imgAlternateFalse from "figma:asset/ba9f4b8e17ab49c0146123ed44fdd8620311d726.png";
import imgAlternateTrue from "figma:asset/e305aba212440b8f4e00d513a6d63488a81a5e74.png";
import svgPaths from "./svg-nbrqo73bhg";
import imgPlaceholderImage from "figma:asset/d568b164c26b35eebe6a407c03f478bc8049c84b.png";
import imgAvatarImage from "figma:asset/3dcedf640c9d3d8d2c2ec8264faedebd456cc72a.png";
import imgPlaceholderImage1 from "figma:asset/b4d0118543bc011744949ebbf871f95430182503.png";
type Actions1Props = {
  text: string;
  additionalClassNames?: string;
};

function Actions1({ children, text, additionalClassNames = "" }: React.PropsWithChildren<Actions1Props>) {
  return (
    <div className="content-stretch flex gap-[24px] items-center relative shrink-0">
      <div className="relative rounded-[6px] shrink-0" data-name="Button">
        <div className="flex flex-row items-center justify-center overflow-clip rounded-[inherit] size-full">
          <div className={clsx("content-stretch flex items-center justify-center relative", additionalClassNames)}>
            <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.6] not-italic relative shrink-0 text-[18px] text-white whitespace-nowrap">{text}</p>
          </div>
        </div>
        <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.2)] border-solid inset-[-1px] pointer-events-none rounded-[7px]" />
      </div>
      <Wrapper>
        <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.6] not-italic relative shrink-0 text-[18px] text-white whitespace-nowrap">{"Arrow"}</p>
        <ChevronRight>
          <path d={svgPaths.p36daa800} fill="var(--fill-0, white)" id="Vector" stroke="var(--stroke-0, white)" />
        </ChevronRight>
      </Wrapper>
    </div>
  );
}

function ChevronRight({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="overflow-clip relative shrink-0 size-[24px]">
      <div className="absolute inset-[25.72%_36.66%_25.88%_35.46%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6.69159 11.6166">
          {children}
        </svg>
      </div>
    </div>
  );
}

function Wrapper({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative rounded-[6px] shrink-0">
      <div className="flex flex-row items-center justify-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex gap-[8px] items-center justify-center relative">{children}</div>
      </div>
    </div>
  );
}
type LinkText1Props = {
  text: string;
};

function LinkText1({ text }: LinkText1Props) {
  return (
    <div className="content-stretch flex items-start py-[8px] relative shrink-0 w-full">
      <p className="flex-[1_0_0] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[1.6] min-h-px min-w-px not-italic relative text-[16px] text-white">{text}</p>
    </div>
  );
}

function PlaceholderLogo() {
  return (
    <div className="h-[48px] overflow-clip relative shrink-0 w-[120px]">
      <div className="-translate-x-1/2 -translate-y-1/2 absolute h-[19.286px] left-[calc(50%-0.01px)] top-1/2 w-[115.698px]" data-name="Logo">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 115.698 19.2858">
          <g id="Logo">
            <path clipRule="evenodd" d={svgPaths.p3b421080} fill="var(--fill-0, #030404)" fillRule="evenodd" />
            <path d={svgPaths.p1d594540} fill="var(--fill-0, #030404)" />
            <path clipRule="evenodd" d={svgPaths.p6ba80c0} fill="var(--fill-0, #030404)" fillRule="evenodd" />
            <path d={svgPaths.p178c7100} fill="var(--fill-0, #030404)" />
            <path clipRule="evenodd" d={svgPaths.p37a14400} fill="var(--fill-0, #030404)" fillRule="evenodd" />
            <path d={svgPaths.p1cca50c0} fill="var(--fill-0, #030404)" />
            <path clipRule="evenodd" d={svgPaths.pc635100} fill="var(--fill-0, #030404)" fillRule="evenodd" />
            <path d={svgPaths.p2a2e9600} fill="var(--fill-0, #030404)" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function AvatarImageImage() {
  return (
    <div className="relative shrink-0 size-[56px]">
      <img alt="" className="absolute block max-w-none size-full" height="56" src={imgAvatarImage} width="56" />
    </div>
  );
}
type AvatarContentProps = {
  text: string;
  text1: string;
};

function AvatarContent({ text, text1 }: AvatarContentProps) {
  return (
    <div className="content-stretch flex flex-col items-start leading-[1.6] not-italic relative shrink-0 text-[#030404] text-[18px] whitespace-nowrap">
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold relative shrink-0">{text}</p>
      <p className="font-['Inter:Regular',sans-serif] font-normal relative shrink-0">{text1}</p>
    </div>
  );
}

function Stars() {
  return (
    <div className="h-[18.889px] relative shrink-0 w-[116px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 116 18.8889">
        <g clipPath="url(#clip0_663_3230)" id="Stars">
          <path d={svgPaths.p23629f00} fill="var(--fill-0, #030404)" id="Vector" />
          <path d={svgPaths.p84d7480} fill="var(--fill-0, #030404)" id="Vector_2" />
          <path d={svgPaths.p24418170} fill="var(--fill-0, #030404)" id="Vector_3" />
          <path d={svgPaths.p28ff5800} fill="var(--fill-0, #030404)" id="Vector_4" />
          <path d={svgPaths.p32177b30} fill="var(--fill-0, #030404)" id="Vector_5" />
        </g>
        <defs>
          <clipPath id="clip0_663_3230">
            <rect fill="white" height="18.8889" width="116" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}
type ListItemProps = {
  text: string;
  text1: string;
};

function ListItem({ text, text1 }: ListItemProps) {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-h-px min-w-px relative">
      <div className="overflow-clip relative shrink-0 size-[48px]" data-name="Relume">
        <div className="absolute inset-[8.33%_12.5%]" data-name="Vector">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 36 40.0002">
            <path clipRule="evenodd" d={svgPaths.p1bdd000} fill="var(--fill-0, #030404)" fillRule="evenodd" id="Vector" />
          </svg>
        </div>
      </div>
      <p className="font-['Fraunces:Bold',sans-serif] font-bold leading-[1.2] min-w-full relative shrink-0 text-[#030404] text-[32px] tracking-[0.32px] w-[min-content]" style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 1" }}>
        {text}
      </p>
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.6] min-w-full not-italic relative shrink-0 text-[#030404] text-[18px] w-[min-content]">{text1}</p>
    </div>
  );
}

function RowDivider() {
  return (
    <div className="relative self-stretch shrink-0 w-0">
      <div className="absolute inset-[0_-0.5px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 300">
          <path d="M0.5 0V300" id="Divider" stroke="var(--stroke-0, #030404)" strokeOpacity="0.15" />
        </svg>
      </div>
    </div>
  );
}

function Automation() {
  return (
    <div className="relative shrink-0 size-[48px]">
      <div className="absolute inset-[11.75%_7.43%_11.88%_7.53%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 40.8187 36.66">
          <path d={svgPaths.p31d0ec80} fill="var(--fill-0, #030404)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}
type Content1Props = {
  text: string;
  text1: string;
};

function Content1({ text, text1 }: Content1Props) {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 text-[#030404] w-full">
      <p className="font-['Fraunces:Bold',sans-serif] font-bold leading-[1.2] relative shrink-0 text-[32px] tracking-[0.32px] w-full" style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 1" }}>
        {text}
      </p>
      <p className="font-['Roboto:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[16px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
        {text1}
      </p>
    </div>
  );
}
type ContentProps = {
  text: string;
  text1: string;
};

function Content({ text, text1 }: ContentProps) {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-h-px min-w-px relative text-white">
      <p className="font-['Fraunces:Bold',sans-serif] font-bold leading-[1.2] relative shrink-0 text-[32px] tracking-[0.32px] w-full" style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 1" }}>
        {text}
      </p>
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.6] not-italic relative shrink-0 text-[18px] w-full">{text1}</p>
    </div>
  );
}

function PlaceholderImageImage() {
  return (
    <div className="aspect-[600/640] flex-[1_0_0] min-h-px min-w-px relative rounded-[8px]">
      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[8px] size-full" src={imgPlaceholderImage} />
    </div>
  );
}
type ListItemTextProps = {
  text: string;
};

function ListItemText({ text }: ListItemTextProps) {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full">
      <ul className="block flex-[1_0_0] font-['Inter:Regular',sans-serif] font-normal leading-[0] min-h-px min-w-px not-italic relative text-[18px] text-white">
        <li className="list-disc ms-[27px]">
          <span className="leading-[1.6]">{text}</span>
        </li>
      </ul>
    </div>
  );
}
type HelperProps = {
  text: string;
  text1: string;
  additionalClassNames?: string;
};

function Helper({ text, text1, additionalClassNames = "" }: HelperProps) {
  return (
    <div className={clsx("content-stretch flex flex-col gap-[24px] relative shrink-0 w-full", additionalClassNames)}>
      <p className="font-['Fraunces:Bold',sans-serif] font-bold leading-[1.2] relative shrink-0 text-[60px] tracking-[0.6px] w-full" style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 1" }}>
        {text}
      </p>
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.6] not-italic relative shrink-0 text-[20px] w-full">{text1}</p>
    </div>
  );
}
type ActionsProps = {
  additionalClassNames?: string;
};

function Actions({ additionalClassNames = "" }: ActionsProps) {
  return (
    <div className="content-stretch flex gap-[16px] items-start relative shrink-0">
      <div className="bg-[#6a89a7] relative rounded-[6px] shrink-0" data-name="Button">
        <div aria-hidden="true" className="absolute border border-[#6a89a7] border-solid inset-[-1px] pointer-events-none rounded-[7px]" />
        <div className="flex flex-row items-center justify-center size-full">
          <Text1 text="Demo" additionalClassNames="px-[12px] py-[6px]" />
        </div>
      </div>
      <div className="relative rounded-[6px] shrink-0" data-name="Button">
        <div aria-hidden="true" className="absolute border border-[rgba(3,4,4,0.15)] border-solid inset-[-1px] pointer-events-none rounded-[7px]" />
        <div className="flex flex-row items-center justify-center size-full">
          <Text text="Try" additionalClassNames="px-[12px] py-[6px]" />
        </div>
      </div>
    </div>
  );
}

function Text1({ text, additionalClassNames = "" }: Text1Props) {
  return (
    <div className={clsx("content-stretch flex items-center justify-center relative", additionalClassNames)}>
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.6] not-italic relative shrink-0 text-[18px] text-white whitespace-nowrap">{text}</p>
    </div>
  );
}
type TextProps = {
  text: string;
  additionalClassNames?: string;
};

function Text({ text, additionalClassNames = "" }: TextProps) {
  return (
    <div className={clsx("content-stretch flex items-center justify-center relative", additionalClassNames)}>
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.6] not-italic relative shrink-0 text-[#030404] text-[18px] whitespace-nowrap">{text}</p>
    </div>
  );
}
type LinkTextProps = {
  text: string;
};

function LinkText({ text }: LinkTextProps) {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0">
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.6] not-italic relative shrink-0 text-[#030404] text-[18px] whitespace-nowrap">{text}</p>
    </div>
  );
}
type CompanyLogoProps = {
  className?: string;
  alternate?: boolean;
};

function CompanyLogo({ className, alternate = false }: CompanyLogoProps) {
  return (
    <div className={className || "h-[32px] overflow-clip relative w-[84px]"}>
      <img alt="" className="absolute inset-0 max-w-none object-contain pointer-events-none size-full" src={alternate ? imgAlternateTrue : imgAlternateFalse} />
    </div>
  );
}

export default function Frame() {
  return (
    <div className="relative size-full">
      <div className="absolute contents left-0 top-0">
        <div className="absolute bg-white content-stretch flex flex-col h-[72px] items-center justify-center left-0 px-[64px] top-0 w-[1440px]" data-name="Navbar / 1 /">
          <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Container">
            <div className="content-stretch flex h-[40px] items-center justify-center relative shrink-0 w-[80px]" data-name="Content">
              <CompanyLogo className="h-[32px] relative shrink-0 w-[84px]" />
            </div>
            <div className="content-stretch flex gap-[32px] items-center justify-center relative shrink-0" data-name="Column">
              <div className="content-stretch flex gap-[32px] items-center justify-end relative shrink-0" data-name="Nav links">
                <LinkText text="How it works" />
                <LinkText text="Features" />
                <LinkText text="Solutions" />
                <div className="content-stretch flex gap-[4px] items-center justify-center relative shrink-0" data-name="Link">
                  <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Nav Link Dropdown">
                    <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.6] not-italic relative shrink-0 text-[#030404] text-[18px] whitespace-nowrap">Resources</p>
                    <div className="relative shrink-0 size-[24px]" data-name="Chevron Down">
                      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                        <g id="Chevron Down">
                          <path clipRule="evenodd" d={svgPaths.pee47f00} fill="var(--fill-0, #030404)" fillRule="evenodd" id="Vector" />
                        </g>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex gap-[16px] items-center justify-center relative shrink-0" data-name="Actions">
                <div className="relative rounded-[6px] shrink-0" data-name="Button">
                  <div aria-hidden="true" className="absolute border border-[rgba(3,4,4,0.15)] border-solid inset-[-1px] pointer-events-none rounded-[7px]" />
                  <div className="flex flex-row items-center justify-center size-full">
                    <Text text="Demo" additionalClassNames="px-[10px] py-[4px]" />
                  </div>
                </div>
                <div className="bg-[#6a89a7] relative rounded-[6px] shrink-0" data-name="Button">
                  <div aria-hidden="true" className="absolute border border-[#6a89a7] border-solid inset-[-1px] pointer-events-none rounded-[7px]" />
                  <div className="flex flex-row items-center justify-center size-full">
                    <Text1 text="Try" additionalClassNames="px-[10px] py-[4px]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bg-[#f2f2f2] content-stretch flex flex-col items-center left-0 overflow-clip px-[64px] py-[112px] top-[72px] w-[1440px]" data-name="Header / 62 /">
          <div className="content-stretch flex flex-col items-center max-w-[1280px] relative shrink-0 w-full" data-name="Container">
            <div className="content-stretch flex flex-col gap-[32px] items-center max-w-[768px] relative shrink-0 w-full" data-name="Component">
              <div className="content-stretch flex flex-col gap-[16px] items-center relative shrink-0 w-full" data-name="Section Title">
                <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Tagline Wrapper">
                  <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[1.5] not-italic relative shrink-0 text-[#030404] text-[16px] text-center whitespace-nowrap">RevOps</p>
                </div>
                <div className="content-stretch flex flex-col gap-[24px] items-center relative shrink-0 text-[#030404] text-center w-full" data-name="Content">
                  <p className="font-['Fraunces:Bold',sans-serif] font-bold leading-[1.1] relative shrink-0 text-[84px] tracking-[0.84px] w-full" style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 1" }}>
                    Unify revenue truth
                  </p>
                  <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.6] not-italic relative shrink-0 text-[20px] w-full">Every GTM signal, touchpoint, and outcome flows through one canonical workspace. No blind spots. No hallucinated insights.</p>
                </div>
              </div>
              <Actions />
            </div>
          </div>
        </div>
        <div className="absolute bg-[#2c3a47] content-stretch flex flex-col items-center left-0 overflow-clip px-[64px] py-[112px] top-[589px] w-[1440px]" data-name="Layout / 210 /">
          <div className="content-stretch flex flex-col items-start max-w-[1280px] relative shrink-0 w-full" data-name="Container">
            <div className="content-stretch flex gap-[80px] items-center relative shrink-0 w-full" data-name="Component">
              <PlaceholderImageImage />
              <div className="content-stretch flex flex-[1_0_0] flex-col gap-[32px] items-start min-h-px min-w-px relative" data-name="Content">
                <div className="content-stretch flex flex-col gap-[32px] items-start relative shrink-0 w-full" data-name="Content">
                  <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-name="Section Title">
                    <div className="content-stretch flex items-center relative shrink-0" data-name="Tagline Wrapper">
                      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[1.5] not-italic relative shrink-0 text-[16px] text-white whitespace-nowrap">Foundation</p>
                    </div>
                    <Helper text="The Spine standardizes your fragmented stack" text1="CRM data, marketing touchpoints, sales outcomes, and customer signals all pass through an 8-stage pipeline. What emerges is your single source of truth for revenue operations." additionalClassNames="items-start text-white" />
                  </div>
                  <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-name="List">
                    <ListItemText text="CRM and sales data unified" />
                    <ListItemText text="Marketing and customer signals integrated" />
                    <ListItemText text="One canonical truth boundary" />
                  </div>
                </div>
                <Actions1 text="Learn" additionalClassNames="px-[12px] py-[6px]" />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bg-[#6a89a7] content-stretch flex flex-col items-center left-0 overflow-clip px-[64px] py-[112px] top-[1453px] w-[1440px]" data-name="Layout / 32 /">
          <div className="content-stretch flex flex-col items-start max-w-[1280px] relative shrink-0 w-full" data-name="Container">
            <div className="content-stretch flex gap-[80px] items-center relative shrink-0 w-full" data-name="Component">
              <div className="content-stretch flex flex-[1_0_0] flex-col gap-[32px] items-start min-h-px min-w-px relative" data-name="Content">
                <div className="content-stretch flex flex-col gap-[32px] items-start py-[8px] relative shrink-0 w-full" data-name="List">
                  <div className="content-stretch flex gap-[24px] items-start relative shrink-0 w-full" data-name="List Item">
                    <div className="relative shrink-0 size-[48px]" data-name="pip">
                      <div className="absolute inset-[14.55%_7.69%_16.02%_6.33%]" data-name="Vector">
                        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 41.2716 33.3275">
                          <path d={svgPaths.p5312700} fill="var(--fill-0, white)" id="Vector" />
                        </svg>
                      </div>
                    </div>
                    <Content text="Pipeline health" text1="AI surfaces real risks before they become losses. Evidence-based, always human-approved." />
                  </div>
                  <div className="content-stretch flex gap-[24px] items-start relative shrink-0 w-full" data-name="List Item">
                    <div className="relative shrink-0 size-[48px]" data-name="online_prediction">
                      <div className="absolute inset-[20.44%_6.42%_20.44%_6.46%]" data-name="Vector">
                        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 41.8175 28.3823">
                          <path d={svgPaths.p1bbe4600} fill="var(--fill-0, white)" id="Vector" />
                        </svg>
                      </div>
                    </div>
                    <Content text="Forecast accuracy" text1="Complete context eliminates guesswork. Predictions compound as outcomes feed back into the system." />
                  </div>
                  <div className="content-stretch flex gap-[24px] items-start relative shrink-0 w-full" data-name="List Item">
                    <div className="relative shrink-0 size-[48px]" data-name="process_chart">
                      <div className="absolute inset-[24.34%_7.8%_24.34%_7.59%]" data-name="Vector">
                        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 40.6137 24.6382">
                          <path d={svgPaths.pa295e00} fill="var(--fill-0, white)" id="Vector" />
                        </svg>
                      </div>
                    </div>
                    <Content text="Process optimization" text1="Spot bottlenecks and inefficiencies. Recommendations come with the data to back them up." />
                  </div>
                </div>
                <Actions1 text="Explore" additionalClassNames="px-[12px] py-[6px]" />
              </div>
              <PlaceholderImageImage />
            </div>
          </div>
        </div>
        <div className="absolute bg-[#e1e7ed] content-stretch flex flex-col items-center left-0 overflow-clip px-[64px] py-[112px] top-[2317px] w-[1440px]" data-name="Layout / 629 /">
          <div className="content-stretch flex flex-col gap-[80px] items-start max-w-[1280px] relative shrink-0 w-full" data-name="Container">
            <div className="content-stretch flex gap-[80px] items-start relative shrink-0 w-full" data-name="Section Title">
              <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-h-px min-w-px overflow-clip relative" data-name="Column">
                <div className="content-stretch flex items-center relative shrink-0" data-name="Tagline Wrapper">
                  <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[1.5] not-italic relative shrink-0 text-[#030404] text-[16px] whitespace-nowrap">Capabilities</p>
                </div>
                <p className="font-['Fraunces:Bold',sans-serif] font-bold leading-[1.2] min-w-full relative shrink-0 text-[#030404] text-[60px] tracking-[0.6px] w-[min-content]" style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 1" }}>
                  Built for revenue operations
                </p>
              </div>
              <p className="flex-[1_0_0] font-['Inter:Regular',sans-serif] font-normal leading-[1.6] min-h-px min-w-px not-italic relative text-[#030404] text-[20px]">IntegrateWise gives you the tools to see everything, act on evidence, and learn from every outcome. No more spreadsheet wrangling. No more reporting inconsistencies.</p>
            </div>
            <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Content">
              <div className="content-stretch flex flex-col items-start justify-center relative shrink-0 w-full" data-name="List">
                <div className="content-stretch flex gap-[32px] items-start relative shrink-0 w-full" data-name="Row">
                  <div aria-hidden="true" className="absolute border-[rgba(3,4,4,0.15)] border-solid border-t inset-0 pointer-events-none" />
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[24px] items-start justify-center min-h-px min-w-px py-[32px] relative" data-name="List Item">
                    <Automation />
                    <Content1 text="Entity 360 visibility" text1="Every account, contact, and deal mapped with complete context across all systems." />
                  </div>
                  <RowDivider />
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[24px] items-start justify-center min-h-px min-w-px py-[32px] relative" data-name="List Item">
                    <Automation />
                    <Content1 text="Workflow automation" text1="Routine tasks run on schedule. Complex decisions wait for human judgment and approval." />
                  </div>
                  <RowDivider />
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[24px] items-start justify-center min-h-px min-w-px py-[32px] relative" data-name="List Item">
                    <Automation />
                    <Content1 text="Approval gates" text1="AI proposes. You decide. The system learns from your choices and improves over time." />
                  </div>
                  <RowDivider />
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[24px] items-start justify-center min-h-px min-w-px py-[32px] relative" data-name="List Item">
                    <Automation />
                    <Content1 text="Continuous learning" text1="Approved outcomes flow back into the Spine. Knowledge compounds. Insights get sharper." />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bg-white content-stretch flex flex-col items-center left-0 overflow-clip px-[64px] py-[112px] top-[3105px] w-[1440px]" data-name="Layout / 29 /">
          <div className="content-stretch flex flex-col items-start max-w-[1280px] relative shrink-0 w-full" data-name="Container">
            <div className="content-stretch flex gap-[80px] items-center relative shrink-0 w-full" data-name="Component">
              <div className="content-stretch flex flex-[1_0_0] flex-col gap-[32px] items-start min-h-px min-w-px relative" data-name="Content">
                <div className="content-stretch flex flex-col gap-[32px] items-start relative shrink-0 w-full" data-name="List Wrapper">
                  <div className="content-stretch flex flex-col gap-[32px] items-start relative shrink-0 w-full" data-name="Content">
                    <div className="content-stretch flex gap-[24px] items-start py-[8px] relative shrink-0 w-full" data-name="Row">
                      <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-h-px min-w-px relative" data-name="List Item">
                        <div className="relative shrink-0 size-[48px]" data-name="report">
                          <div className="absolute inset-[11.85%_11.85%_11.88%_11.88%]" data-name="Vector">
                            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.305 18.305">
                              <path d={svgPaths.p2587d280} fill="var(--fill-0, #030404)" id="Vector" />
                            </svg>
                          </div>
                        </div>
                        <p className="font-['Fraunces:Bold',sans-serif] font-bold leading-[1.2] min-w-full relative shrink-0 text-[#030404] text-[32px] tracking-[0.32px] w-[min-content]" style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 1" }}>
                          End manual wrangling
                        </p>
                        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.6] min-w-full not-italic relative shrink-0 text-[#030404] text-[18px] w-[min-content]">Spreadsheets and manual data pulls disappear. Operations run on truth.</p>
                      </div>
                      <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-h-px min-w-px relative" data-name="List Item">
                        <div className="relative shrink-0 size-[48px]" data-name="transition_chop">
                          <div className="absolute inset-[16.02%_7.69%_16.04%_7.71%]" data-name="Vector">
                            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20.305 16.305">
                              <path d={svgPaths.pc248100} fill="var(--fill-0, #030404)" id="Vector" />
                            </svg>
                          </div>
                        </div>
                        <p className="font-['Fraunces:Bold',sans-serif] font-bold leading-[1.2] min-w-full relative shrink-0 text-[#030404] text-[32px] tracking-[0.32px] w-[min-content]" style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 1" }}>
                          Eliminate inconsistencies
                        </p>
                        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.6] min-w-full not-italic relative shrink-0 text-[#030404] text-[18px] w-[min-content]">One source of truth means everyone sees the same numbers. No more conflicting reports.</p>
                      </div>
                    </div>
                    <div className="content-stretch flex gap-[24px] items-start py-[8px] relative shrink-0 w-full" data-name="Row">
                      <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-h-px min-w-px relative" data-name="List Item">
                        <div className="relative shrink-0 size-[48px]" data-name="visibility">
                          <div className="absolute inset-[16.09%_4.63%_20.26%_4.63%]" data-name="Vector">
                            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21.777 15.275">
                              <path d={svgPaths.p3aab9e00} fill="var(--fill-0, #030404)" id="Vector" />
                            </svg>
                          </div>
                        </div>
                        <p className="font-['Fraunces:Bold',sans-serif] font-bold leading-[1.2] min-w-full relative shrink-0 text-[#030404] text-[32px] tracking-[0.32px] w-[min-content]" style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 1" }}>
                          Surface root causes
                        </p>
                        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.6] min-w-full not-italic relative shrink-0 text-[#030404] text-[18px] w-[min-content]">Why did that deal slip? Why is churn accelerating? The data tells the story.</p>
                      </div>
                      <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-h-px min-w-px relative" data-name="List Item">
                        <div className="relative shrink-0 size-[48px]" data-name="motion_mode">
                          <div className="absolute inset-[8.95%_8.95%_8.95%_13.56%]" data-name="Vector">
                            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.5968 19.7035">
                              <path d={svgPaths.p39925000} fill="var(--fill-0, #030404)" id="Vector" />
                            </svg>
                          </div>
                        </div>
                        <p className="font-['Fraunces:Bold',sans-serif] font-bold leading-[1.2] min-w-full relative shrink-0 text-[#030404] text-[32px] tracking-[0.32px] w-[min-content]" style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 1" }}>
                          Drive with confidence
                        </p>
                        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.6] min-w-full not-italic relative shrink-0 text-[#030404] text-[18px] w-[min-content]">Make changes backed by evidence. Measure impact. Adjust. Repeat.</p>
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex gap-[24px] items-start py-[8px] relative shrink-0 w-full" data-name="List">
                    <ListItem text="Short heading here" text1="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros." />
                    <ListItem text="Short heading here" text1="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros." />
                  </div>
                </div>
                <div className="content-stretch flex gap-[24px] items-center relative shrink-0" data-name="Actions">
                  <div className="relative rounded-[6px] shrink-0" data-name="Button">
                    <div className="flex flex-row items-center justify-center overflow-clip rounded-[inherit] size-full">
                      <Text text="Start" additionalClassNames="px-[12px] py-[6px]" />
                    </div>
                    <div aria-hidden="true" className="absolute border border-[rgba(3,4,4,0.15)] border-solid inset-[-1px] pointer-events-none rounded-[7px]" />
                  </div>
                  <Wrapper>
                    <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.6] not-italic relative shrink-0 text-[#030404] text-[18px] whitespace-nowrap">Arrow</p>
                    <ChevronRight>
                      <path d={svgPaths.p36daa800} fill="var(--fill-0, #030404)" id="Vector" stroke="var(--stroke-0, #030404)" />
                    </ChevronRight>
                  </Wrapper>
                </div>
              </div>
              <PlaceholderImageImage />
            </div>
          </div>
        </div>
        <div className="absolute bg-[#e1e7ed] content-stretch flex flex-col items-center left-0 overflow-clip px-[64px] py-[112px] top-[4272px] w-[1440px]" data-name="Testimonial / 6 /">
          <div className="content-stretch flex flex-col gap-[80px] items-start max-w-[1280px] relative shrink-0 w-full" data-name="Container">
            <Helper text="From leaders" text1="Who trust IntegrateWise" additionalClassNames="items-start max-w-[768px] text-[#030404]" />
            <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Content">
              <div className="content-stretch flex gap-[32px] items-start relative shrink-0 w-full" data-name="Row">
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[32px] items-start min-h-px min-w-px overflow-clip relative" data-name="Column">
                  <Stars />
                  <p className="font-['Fraunces:Bold',sans-serif] font-bold leading-[1.2] min-w-full relative shrink-0 text-[#030404] text-[26px] tracking-[0.26px] w-[min-content]" style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 1" }}>{`"We stopped chasing data across five different systems and started making decisions on what actually matters."`}</p>
                  <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0" data-name="Avatar">
                    <AvatarImageImage />
                    <AvatarContent text="Sarah Chen" text1="VP RevOps, Velocity" />
                    <PlaceholderLogo />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[32px] items-start min-h-px min-w-px overflow-clip relative" data-name="Column">
                  <Stars />
                  <p className="font-['Fraunces:Bold',sans-serif] font-bold leading-[1.2] min-w-full relative shrink-0 text-[#030404] text-[26px] tracking-[0.26px] w-[min-content]" style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 1" }}>{`"The approval gates mean AI works for us, not the other way around. We control every move."`}</p>
                  <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0" data-name="Avatar">
                    <AvatarImageImage />
                    <AvatarContent text="Marcus Webb" text1="Chief Revenue Officer, Prism" />
                    <PlaceholderLogo />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[32px] items-start min-h-px min-w-px overflow-clip relative" data-name="Column">
                  <Stars />
                  <p className="font-['Fraunces:Bold',sans-serif] font-bold leading-[1.2] min-w-full relative shrink-0 text-[#030404] text-[26px] tracking-[0.26px] w-[min-content]" style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 1" }}>{`"Forecasting went from art to science. The Spine doesn't lie, and neither do our predictions."`}</p>
                  <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0" data-name="Avatar">
                    <AvatarImageImage />
                    <AvatarContent text="Elena Rodriguez" text1="RevOps Head, Ascent" />
                    <PlaceholderLogo />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bg-white content-stretch flex flex-col items-center left-0 overflow-clip top-[5104.89px] w-[1440px]" data-name="CTA / 65 /">
          <div className="relative shrink-0 w-full" data-name="Content">
            <div className="flex flex-col items-center size-full">
              <div className="content-stretch flex flex-col items-center px-[64px] py-[112px] relative w-full">
                <div className="content-stretch flex flex-col items-center max-w-[1280px] relative shrink-0 w-full" data-name="Container">
                  <div className="content-stretch flex flex-col gap-[32px] items-center max-w-[768px] relative shrink-0 w-full" data-name="Content">
                    <Helper text="See your revenue truth" text1="Watch how a unified spine transforms operations from reactive to proactive. Book a demo with our team." additionalClassNames="items-center text-[#030404] text-center" />
                    <Actions />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="aspect-[1440/810] relative shrink-0 w-full" data-name="Placeholder Image">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgPlaceholderImage1} />
          </div>
        </div>
        <div className="absolute bg-[#2c3a47] content-stretch flex flex-col items-center left-0 overflow-clip px-[64px] py-[80px] top-[6371.89px] w-[1440px]" data-name="Footer / 3 /">
          <div className="content-stretch flex flex-col gap-[80px] items-start max-w-[1280px] relative shrink-0 w-full" data-name="Container">
            <div className="content-stretch flex gap-[64px] items-start relative shrink-0 w-full" data-name="Content">
              <div className="content-stretch flex flex-[1_0_0] flex-col gap-[32px] items-start min-h-px min-w-px overflow-clip relative" data-name="Column">
                <CompanyLogo alternate className="h-[32px] relative shrink-0 w-[84px]" />
                <div className="content-stretch flex flex-col gap-[24px] items-start leading-[1.6] not-italic relative shrink-0 text-[16px] text-white w-full" data-name="Content">
                  <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full" data-name="Content">
                    <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold relative shrink-0 w-full">Address</p>
                    <p className="font-['Inter:Regular',sans-serif] font-normal relative shrink-0 w-full">San Francisco, CA 94105</p>
                  </div>
                  <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full" data-name="Content">
                    <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold relative shrink-0 w-full">Contact</p>
                    <div className="content-stretch flex flex-col font-['Inter:Regular',sans-serif] font-normal items-start relative shrink-0 underline w-full" data-name="Content">
                      <p className="[text-decoration-skip-ink:none] decoration-solid relative shrink-0 w-full">+1 (415) 555-0147</p>
                      <p className="[text-decoration-skip-ink:none] decoration-solid relative shrink-0 w-full">hello@integratewise.com</p>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-name="Social Links">
                  <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Facebook">
                    <div className="absolute inset-[9.34%_8.33%_7.32%_8.33%]" data-name="Vector">
                      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                        <path d={svgPaths.p2c56c980} fill="var(--fill-0, white)" id="Vector" />
                      </svg>
                    </div>
                  </div>
                  <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Instagram">
                    <div className="absolute inset-[13.51%_12.5%_11.49%_12.5%]" data-name="Vector">
                      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
                        <path clipRule="evenodd" d={svgPaths.p9b0b480} fill="var(--fill-0, white)" fillRule="evenodd" id="Vector" />
                      </svg>
                    </div>
                  </div>
                  <div className="overflow-clip relative shrink-0 size-[24px]" data-name="X">
                    <div className="absolute inset-[17.68%_12.5%_15.66%_12.5%]" data-name="Vector">
                      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 16">
                        <path d={svgPaths.pd265900} fill="var(--fill-0, white)" id="Vector" />
                      </svg>
                    </div>
                  </div>
                  <div className="overflow-clip relative shrink-0 size-[24px]" data-name="LinkedIn">
                    <div className="absolute inset-[13.51%_12.5%_11.49%_12.5%]" data-name="Vector">
                      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
                        <path clipRule="evenodd" d={svgPaths.p56afe80} fill="var(--fill-0, white)" fillRule="evenodd" id="Vector" />
                      </svg>
                    </div>
                  </div>
                  <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Youtube">
                    <div className="absolute inset-[20.83%_8.33%_20.78%_8.27%]" data-name="Vector">
                      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20.0141 14.012">
                        <path d={svgPaths.p1fcc3d80} fill="var(--fill-0, white)" id="Vector" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-[1_0_0] gap-[24px] items-start max-w-[400px] min-h-px min-w-px overflow-clip relative" data-name="Column">
                <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px relative" data-name="Link List">
                  <LinkText1 text="How it works" />
                  <LinkText1 text="Features" />
                  <LinkText1 text="Solutions" />
                  <LinkText1 text="Pricing" />
                  <LinkText1 text="About" />
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px relative" data-name="Link List">
                  <LinkText1 text="Contact" />
                  <LinkText1 text="Book demo" />
                  <LinkText1 text="Try IntegrateWise" />
                  <LinkText1 text="Privacy policy" />
                  <div className="content-stretch flex items-start py-[8px] relative shrink-0 w-full" data-name="Link">
                    <p className="flex-[1_0_0] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[1.6] min-h-px min-w-px not-italic relative text-[16px] text-white">{`Terms & conditions`}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[32px] items-start relative shrink-0 w-full" data-name="Credits">
              <div className="h-0 relative shrink-0 w-full" data-name="Divider">
                <div className="absolute inset-[-1px_0_0_0]">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1280 1">
                    <line id="Divider" stroke="var(--stroke-0, white)" strokeOpacity="0.2" x2="1280" y1="0.5" y2="0.5" />
                  </svg>
                </div>
              </div>
              <div className="content-stretch flex font-['Inter:Regular',sans-serif] font-normal items-start justify-between leading-[1.6] not-italic relative shrink-0 text-[16px] text-white w-full whitespace-nowrap" data-name="Row">
                <p className="relative shrink-0">© 2025 IntegrateWise. All rights reserved.</p>
                <div className="content-stretch flex gap-[24px] items-start relative shrink-0 underline" data-name="Footer Links">
                  <p className="[text-decoration-skip-ink:none] decoration-solid relative shrink-0">Privacy policy</p>
                  <p className="[text-decoration-skip-ink:none] decoration-solid relative shrink-0">{`Terms & conditions`}</p>
                  <p className="[text-decoration-skip-ink:none] decoration-solid relative shrink-0">Cookie settings</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}