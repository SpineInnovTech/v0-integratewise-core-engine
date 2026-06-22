import clsx from "clsx";
import imgAlternateFalse from "figma:asset/ba9f4b8e17ab49c0146123ed44fdd8620311d726.png";
import imgAlternateTrue from "figma:asset/e305aba212440b8f4e00d513a6d63488a81a5e74.png";
import svgPaths from "./svg-g9fbedxuvh";
import imgPlaceholderImage from "figma:asset/e26e95ea9b50334f01c5f0349387a6f299f83458.png";
import imgPlaceholderImage1 from "figma:asset/50992020190a8938a8a1cfb09c034e2ad7af2703.png";
import imgPlaceholderImage2 from "figma:asset/e92de2fb857078d138d24cced07f43997b60e548.png";
import imgPlaceholderImage3 from "figma:asset/cd2b13cd234ae03c0635651abda8573eea806507.png";
import imgPlaceholderImage4 from "figma:asset/e58388f0e6157742fe0aee54c61834e095f95d2f.png";
import imgPlaceholderImage5 from "figma:asset/ef79a99f85262f89282333aab483dbbf5935e6ad.png";
import imgPlaceholderImage6 from "figma:asset/764cf2a263a53590e7011aeecc011a52534256de.png";
import imgAvatarImage from "figma:asset/4e7c0cb64f2c6ea336d7f42bdae0b25c0ba739aa.png";
import imgAvatarImage1 from "figma:asset/084855057d315c35d5968bb72bd77ab363f6370a.png";
import imgAvatarImage2 from "figma:asset/b821ede15d1779e4990e146ffd6e9d337f30a861.png";

function Button({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative rounded-[6px] shrink-0">
      <div aria-hidden="true" className="absolute border border-[rgba(3,4,4,0.15)] border-solid inset-[-1px] pointer-events-none rounded-[7px]" />
      <div className="flex flex-row items-center justify-center size-full">{children}</div>
    </div>
  );
}
type ActionsProps = {
  text: string;
  additionalClassNames?: string;
};

function Actions({ children, text, additionalClassNames = "" }: React.PropsWithChildren<ActionsProps>) {
  return (
    <div className="content-stretch flex gap-[16px] items-start relative shrink-0">
      <div className="bg-[#6a89a7] relative rounded-[6px] shrink-0">
        <div aria-hidden="true" className="absolute border border-[#6a89a7] border-solid inset-[-1px] pointer-events-none rounded-[7px]" />
        <div className="flex flex-row items-center justify-center size-full">
          <Text1 text="Demo" additionalClassNames="px-[12px] py-[6px]" />
        </div>
      </div>
      <Button additionalClassNames={additionalClassNames}>
        <div className={clsx("content-stretch flex items-center justify-center relative", additionalClassNames)}>
          <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.6] not-italic relative shrink-0 text-[#030404] text-[18px] whitespace-nowrap">{text}</p>
        </div>
      </Button>
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

function Wrapper1({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative rounded-[6px] shrink-0">
      <div className="flex flex-row items-center justify-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex gap-[8px] items-center justify-center relative">{children}</div>
      </div>
    </div>
  );
}

function Wrapper({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0 w-full">
      <div className="content-stretch flex items-start pb-[24px] px-[24px] relative w-full">
        <p className="flex-[1_0_0] font-['Inter:Regular',sans-serif] font-normal leading-[1.6] min-h-px min-w-px not-italic relative text-[#030404] text-[18px]">{children}</p>
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
type AnswerTextProps = {
  text: string;
};

function AnswerText({ text }: AnswerTextProps) {
  return <Wrapper>{text}</Wrapper>;
}
type QuestionTextProps = {
  text: string;
};

function QuestionText({ text }: QuestionTextProps) {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex gap-[24px] items-center px-[24px] py-[20px] relative w-full">
          <p className="flex-[1_0_0] font-['Inter:Bold',sans-serif] font-bold leading-[1.6] min-h-px min-w-px not-italic relative text-[#030404] text-[20px]">{text}</p>
          <div className="overflow-clip relative shrink-0 size-[24px]" data-name="close">
            <div className="absolute inset-[22.6%]" data-name="Vector">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13.15 13.15">
                <path d={svgPaths.p23282800} fill="var(--fill-0, #030404)" id="Vector" stroke="var(--stroke-0, #030404)" />
              </svg>
            </div>
          </div>
        </div>
      </div>
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
        <g clipPath="url(#clip0_663_730)" id="Stars">
          <path d={svgPaths.p23629f00} fill="var(--fill-0, #030404)" id="Vector" />
          <path d={svgPaths.p84d7480} fill="var(--fill-0, #030404)" id="Vector_2" />
          <path d={svgPaths.p24418170} fill="var(--fill-0, #030404)" id="Vector_3" />
          <path d={svgPaths.p28ff5800} fill="var(--fill-0, #030404)" id="Vector_4" />
          <path d={svgPaths.p32177b30} fill="var(--fill-0, #030404)" id="Vector_5" />
        </g>
        <defs>
          <clipPath id="clip0_663_730">
            <rect fill="white" height="18.8889" width="116" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}
type ContentProps = {
  text: string;
  text1: string;
};

function Content({ text, text1 }: ContentProps) {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-center relative shrink-0 text-[#030404] text-center w-full">
      <p className="font-['Fraunces:Bold',sans-serif] font-bold leading-[1.2] relative shrink-0 text-[40px] tracking-[0.4px] w-full" style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 1" }}>
        {text}
      </p>
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.6] not-italic relative shrink-0 text-[18px] w-full">{text1}</p>
    </div>
  );
}
type ButtonTextProps = {
  text: string;
};

function ButtonText({ text }: ButtonTextProps) {
  return (
    <Wrapper1>
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.6] not-italic relative shrink-0 text-[#030404] text-[18px] whitespace-nowrap">{text}</p>
      <ChevronRight>
        <path d={svgPaths.p36daa800} fill="var(--fill-0, #030404)" id="Vector" stroke="var(--stroke-0, #030404)" />
      </ChevronRight>
    </Wrapper1>
  );
}
type ActionsText1Props = {
  text: string;
  additionalClassNames?: string;
};

function ActionsText1({ text, additionalClassNames = "" }: ActionsText1Props) {
  return (
    <div className="content-stretch flex gap-[24px] items-center relative shrink-0">
      <div className="relative rounded-[6px] shrink-0" data-name="Button">
        <div className="flex flex-row items-center justify-center overflow-clip rounded-[inherit] size-full">
          <Text text="Explore" additionalClassNames="px-[12px] py-[6px]" />
        </div>
        <div aria-hidden="true" className="absolute border border-[rgba(3,4,4,0.15)] border-solid inset-[-1px] pointer-events-none rounded-[7px]" />
      </div>
      <ButtonText text={text} />
    </div>
  );
}
type TaglineWrapperText1Props = {
  text: string;
};

function TaglineWrapperText1({ text }: TaglineWrapperText1Props) {
  return (
    <div className="content-stretch flex items-center relative shrink-0">
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[1.5] not-italic relative shrink-0 text-[#030404] text-[16px] text-center whitespace-nowrap">{text}</p>
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
    <div className={clsx("content-stretch flex flex-col gap-[24px] items-center relative shrink-0 text-[#030404] text-center w-full", additionalClassNames)}>
      <p className="font-['Fraunces:Bold',sans-serif] font-bold leading-[1.2] relative shrink-0 text-[60px] tracking-[0.6px] w-full" style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 1" }}>
        {text}
      </p>
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.6] not-italic relative shrink-0 text-[20px] w-full">{text1}</p>
    </div>
  );
}
type ActionsTextProps = {
  text: string;
  additionalClassNames?: string;
};

function ActionsText({ text, additionalClassNames = "" }: ActionsTextProps) {
  return (
    <div className="content-stretch flex gap-[24px] items-center relative shrink-0">
      <div className="relative rounded-[6px] shrink-0" data-name="Button">
        <div className="flex flex-row items-center justify-center overflow-clip rounded-[inherit] size-full">
          <Text1 text="Explore" additionalClassNames="px-[12px] py-[6px]" />
        </div>
        <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.2)] border-solid inset-[-1px] pointer-events-none rounded-[7px]" />
      </div>
      <Wrapper1>
        <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.6] not-italic relative shrink-0 text-[18px] text-white whitespace-nowrap">{text}</p>
        <ChevronRight>
          <path d={svgPaths.p36daa800} fill="var(--fill-0, white)" id="Vector" stroke="var(--stroke-0, white)" />
        </ChevronRight>
      </Wrapper1>
    </div>
  );
}
type TaglineWrapperTextProps = {
  text: string;
};

function TaglineWrapperText({ text }: TaglineWrapperTextProps) {
  return (
    <div className="content-stretch flex items-center relative shrink-0">
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[1.5] not-italic relative shrink-0 text-[16px] text-white whitespace-nowrap">{text}</p>
    </div>
  );
}
type Text1Props = {
  text: string;
  additionalClassNames?: string;
};

function Text1({ text, additionalClassNames = "" }: Text1Props) {
  return (
    <div className={clsx("content-stretch flex items-center justify-center relative", additionalClassNames)}>
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.6] not-italic relative shrink-0 text-[18px] text-white whitespace-nowrap">{text}</p>
    </div>
  );
}

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

export default function HomeDesktop() {
  return (
    <div className="content-stretch flex flex-col items-start relative size-full" data-name="Home • Desktop">
      <div className="bg-white h-[72px] relative shrink-0 w-full" data-name="Navbar / 1 /">
        <div className="flex flex-col items-center justify-center size-full">
          <div className="content-stretch flex flex-col items-center justify-center px-[64px] relative size-full">
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
                  <Button>
                    <Text text="Demo" additionalClassNames="px-[10px] py-[4px]" />
                  </Button>
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
        </div>
      </div>
      <div className="bg-[#f2f2f2] content-stretch flex flex-col items-center overflow-clip relative shrink-0 w-full" data-name="Header / 145 /">
        <div className="relative shrink-0 w-full" data-name="Content">
          <div className="flex flex-col items-center size-full">
            <div className="content-stretch flex flex-col items-center px-[64px] py-[112px] relative w-full">
              <div className="content-stretch flex flex-col items-center max-w-[1280px] relative shrink-0 w-full" data-name="Container">
                <div className="content-stretch flex flex-col gap-[32px] items-center max-w-[768px] relative shrink-0 w-full" data-name="Column">
                  <div className="content-stretch flex flex-col gap-[24px] items-center relative shrink-0 text-[#030404] text-center w-full" data-name="Content">
                    <p className="font-['Fraunces:Bold',sans-serif] font-bold leading-[1.1] relative shrink-0 text-[84px] tracking-[0.84px] w-full" style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 1" }}>
                      Your business already has the data
                    </p>
                    <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.6] not-italic relative shrink-0 text-[20px] w-full">IntegrateWise is a Knowledge Workspace built on the Spine — a unified intelligence layer that connects your tools, conversations, and decisions into one governed loop. AI thinks in full context, proposes actions with evidence, and always waits for your approval.</p>
                  </div>
                  <Actions text="Learn" additionalClassNames="px-[12px] py-[6px]" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="aspect-[1440/810] relative shrink-0 w-full" data-name="Placeholder Image">
          <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgPlaceholderImage} />
        </div>
      </div>
      <div className="bg-[#2c3a47] relative shrink-0 w-full" data-name="Layout / 430 /">
        <div className="flex flex-col items-center size-full">
          <div className="content-stretch flex flex-col items-center px-[64px] py-[112px] relative w-full">
            <div className="content-stretch flex flex-col gap-[80px] items-start max-w-[1280px] relative shrink-0 w-full" data-name="Container">
              <div className="content-stretch flex flex-col gap-[16px] items-start max-w-[560px] relative shrink-0 w-full" data-name="Section Title">
                <TaglineWrapperText text="Truth" />
                <p className="font-['Fraunces:Bold',sans-serif] font-bold leading-[1.2] min-w-full relative shrink-0 text-[60px] text-white tracking-[0.6px] w-[min-content]" style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 1" }}>
                  Every input becomes normalized truth
                </p>
              </div>
              <div className="content-stretch flex gap-[64px] h-[412px] items-start relative shrink-0 w-full" data-name="Content">
                <div className="content-stretch flex flex-col items-start justify-end relative self-stretch shrink-0 w-[520px]" data-name="Content">
                  <div className="content-stretch flex flex-col gap-[32px] items-start justify-end relative shrink-0 w-full" data-name="Content">
                    <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.6] min-w-full not-italic relative shrink-0 text-[20px] text-white w-[min-content]">The Spine is your canonical truth boundary. Every data point from every tool passes through an 8-stage pipeline before becoming truth. Structured data, unstructured conversations, and AI sessions all flow through one normalized layer.</p>
                    <ActionsText text="Arrow" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] gap-[32px] items-start justify-end min-h-px min-w-px relative self-stretch" data-name="Content">
                  <div className="content-stretch flex flex-[1_0_0] items-start justify-end min-h-px min-w-px pt-[80px] relative" data-name="Image container">
                    <div className="aspect-[348/348] flex-[1_0_0] min-h-px min-w-px relative rounded-[8px]" data-name="Placeholder Image">
                      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[8px] size-full" src={imgPlaceholderImage1} />
                    </div>
                  </div>
                  <div className="aspect-[348/348] flex-[1_0_0] min-h-px min-w-px relative rounded-[8px]" data-name="Placeholder Image">
                    <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[8px] size-full" src={imgPlaceholderImage2} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-[#6a89a7] relative shrink-0 w-full" data-name="Layout / 207 /">
        <div className="flex flex-col items-center overflow-clip rounded-[inherit] size-full">
          <div className="content-stretch flex flex-col items-center px-[64px] py-[112px] relative w-full">
            <div className="content-stretch flex flex-col items-start max-w-[1280px] relative shrink-0 w-full" data-name="Container">
              <div className="content-stretch flex gap-[80px] items-center relative shrink-0 w-full" data-name="Component">
                <div className="aspect-[600/640] flex-[1_0_0] min-h-px min-w-px relative rounded-[8px]" data-name="Placeholder Image">
                  <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[8px] size-full" src={imgPlaceholderImage3} />
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[32px] items-start min-h-px min-w-px relative" data-name="Content">
                  <div className="content-stretch flex flex-col gap-[32px] items-start relative shrink-0 w-full" data-name="Content">
                    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-name="Section Title">
                      <TaglineWrapperText text="Intelligence" />
                      <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 text-white w-full" data-name="Content">
                        <p className="font-['Fraunces:Bold',sans-serif] font-bold leading-[1.2] relative shrink-0 text-[60px] tracking-[0.6px] w-full" style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 1" }}>
                          AI that reasons over complete context
                        </p>
                        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.6] not-italic relative shrink-0 text-[20px] w-full">The cognitive layer reasons over full Entity 360 context. It surfaces signals, drafts interventions, proposes actions — but never executes without your approval. When you approve or reject, that outcome re-ingests so the system learns from your decisions.</p>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-name="List">
                      <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-name="List Item">
                        <div className="relative shrink-0 size-[24px]" data-name="signpost">
                          <div className="absolute inset-[7.69%_13.3%_7.71%_13.3%]" data-name="Vector">
                            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.615 20.305">
                              <path d={svgPaths.p8deca40} fill="var(--fill-0, white)" id="Vector" />
                            </svg>
                          </div>
                        </div>
                        <p className="flex-[1_0_0] font-['Inter:Regular',sans-serif] font-normal leading-[1.6] min-h-px min-w-px not-italic relative text-[18px] text-white">See signals before they become crises</p>
                      </div>
                      <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-name="List Item">
                        <div className="relative shrink-0 size-[24px]" data-name="sheets_rtl">
                          <div className="absolute inset-[3.49%_16.22%_8.29%_13.74%]" data-name="Vector">
                            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.8092 21.1725">
                              <path d={svgPaths.p3623bb00} fill="var(--fill-0, white)" id="Vector" />
                            </svg>
                          </div>
                        </div>
                        <p className="flex-[1_0_0] font-['Inter:Regular',sans-serif] font-normal leading-[1.6] min-h-px min-w-px not-italic relative text-[18px] text-white">Detect risk weeks earlier than spreadsheets</p>
                      </div>
                      <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-name="List Item">
                        <div className="relative shrink-0 size-[24px]" data-name="action_key">
                          <div className="absolute inset-[5.6%_5.6%_5.55%_5.5%]" data-name="Vector">
                            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21.337 21.324">
                              <path d={svgPaths.p27ec7680} fill="var(--fill-0, white)" id="Vector" />
                            </svg>
                          </div>
                        </div>
                        <p className="flex-[1_0_0] font-['Inter:Regular',sans-serif] font-normal leading-[1.6] min-h-px min-w-px not-italic relative text-[18px] text-white">Act on evidence, not hunches</p>
                      </div>
                    </div>
                  </div>
                  <ActionsText text="Arrow" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-[#e1e7ed] relative shrink-0 w-full" data-name="Layout / 153 /">
        <div className="flex flex-col items-center overflow-clip rounded-[inherit] size-full">
          <div className="content-stretch flex flex-col items-center px-[64px] py-[112px] relative w-full">
            <div className="content-stretch flex flex-col gap-[80px] items-center max-w-[1280px] relative shrink-0 w-full" data-name="Container">
              <div className="content-stretch flex flex-col gap-[48px] items-center max-w-[768px] relative shrink-0 w-full" data-name="Content">
                <div className="content-stretch flex flex-col gap-[16px] items-center relative shrink-0" data-name="Content">
                  <TaglineWrapperText1 text="Learning" />
                  <p className="font-['Fraunces:Bold',sans-serif] font-bold leading-[1.2] relative shrink-0 text-[#030404] text-[32px] text-center tracking-[0.32px] w-[768px]" style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 1" }}>
                    Your decisions compound into organizational memory
                  </p>
                </div>
                <ActionsText1 text="Arrow" />
              </div>
              <div className="aspect-[1280/738] relative rounded-[8px] shrink-0 w-full" data-name="Placeholder Image">
                <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[8px] size-full" src={imgPlaceholderImage4} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white relative shrink-0 w-full" data-name="Layout / 237 /">
        <div className="flex flex-col items-center overflow-clip rounded-[inherit] size-full">
          <div className="content-stretch flex flex-col items-center px-[64px] py-[112px] relative w-full">
            <div className="content-stretch flex flex-col gap-[80px] items-center max-w-[1280px] relative shrink-0 w-full" data-name="Container">
              <div className="content-stretch flex flex-col gap-[16px] items-center max-w-[768px] relative shrink-0 w-full" data-name="Section Title">
                <TaglineWrapperText1 text="Capabilities" />
                <Helper text="Built for teams that refuse to guess" text1="IntegrateWise gives you the tools to see everything, know what matters, and act with confidence. No more surprises at the QBR. No more AI that hallucinates on partial data." />
              </div>
              <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Content">
                <div className="content-stretch flex gap-[48px] h-[276px] items-start relative shrink-0 w-full" data-name="Row">
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[24px] items-center min-h-px min-w-px relative" data-name="Column">
                    <div className="relative shrink-0 size-[48px]" data-name="account_box">
                      <div className="absolute inset-[11.85%_11.85%_11.88%_11.88%]" data-name="Vector">
                        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.305 18.305">
                          <path d={svgPaths.p20cfe00} fill="var(--fill-0, #030404)" id="Vector" />
                        </svg>
                      </div>
                    </div>
                    <Content text="See everything clearly" text1="Account 360 briefs, normalization pipelines, and a unified intelligence graph that remembers every decision." />
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[24px] items-center min-h-px min-w-px relative" data-name="Column">
                    <div className="relative shrink-0 size-[48px]" data-name="early_on">
                      <div className="absolute inset-[7.69%_3.42%_-1.49%_11.88%]" data-name="Vector">
                        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20.3287 22.5142">
                          <path d={svgPaths.p1ab32680} fill="var(--fill-0, #030404)" id="Vector" />
                        </svg>
                      </div>
                    </div>
                    <Content text="Know what matters early" text1="Proactive signal detection, depth matrices, and natural language reasoning over your entire truth layer." />
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[24px] items-center min-h-px min-w-px relative" data-name="Column">
                    <div className="relative shrink-0 size-[48px]" data-name="automation">
                      <div className="absolute inset-[11.75%_7.43%_11.88%_7.53%]" data-name="Vector">
                        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20.4093 18.33">
                          <path d={svgPaths.p26a5e480} fill="var(--fill-0, #030404)" id="Vector" />
                        </svg>
                      </div>
                    </div>
                    <Content text="Act with confidence" text1="Human-in-the-loop approvals, governed workflows, and 50+ connectors that keep your stack unified." />
                  </div>
                </div>
              </div>
              <ActionsText1 text="Arrow" />
            </div>
          </div>
        </div>
      </div>
      <div className="bg-[#e1e7ed] relative shrink-0 w-full" data-name="Layout / 34 /">
        <div className="flex flex-col items-center overflow-clip rounded-[inherit] size-full">
          <div className="content-stretch flex flex-col items-center px-[64px] py-[112px] relative w-full">
            <div className="content-stretch flex flex-col items-start max-w-[1280px] relative shrink-0 w-full" data-name="Container">
              <div className="content-stretch flex gap-[80px] items-center relative shrink-0 w-full" data-name="Component">
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[32px] items-start min-h-px min-w-px py-[8px] relative" data-name="List">
                  <div className="content-stretch flex gap-[24px] items-start relative shrink-0 w-full" data-name="List Item">
                    <div className="relative shrink-0 size-[48px]" data-name="discover_tune">
                      <div className="absolute inset-[12.08%]" data-name="Vector">
                        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 36.407 36.407">
                          <path d={svgPaths.p2b284500} fill="var(--fill-0, #030404)" id="Vector" />
                        </svg>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-h-px min-w-px relative" data-name="Content">
                      <p className="font-['Fraunces:Bold',sans-serif] font-bold leading-[1.2] relative shrink-0 text-[#030404] text-[32px] tracking-[0.32px] w-full" style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 1" }}>
                        No more surprises
                      </p>
                      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.6] not-italic relative shrink-0 text-[#030404] text-[18px] w-full">Detect churn risk eight weeks before it shows up at the QBR.</p>
                      <div className="content-stretch flex flex-col items-start pt-[8px] relative shrink-0 w-full" data-name="Action">
                        <ButtonText text="Arrow" />
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex gap-[24px] items-start relative shrink-0 w-full" data-name="List Item">
                    <div className="relative shrink-0 size-[48px]" data-name="straight">
                      <div className="absolute inset-[13.3%_33.53%_11.88%_33.53%]" data-name="Vector">
                        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.813 35.914">
                          <path d={svgPaths.p5522ff0} fill="var(--fill-0, #030404)" id="Vector" />
                        </svg>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-h-px min-w-px relative" data-name="Content">
                      <p className="font-['Fraunces:Bold',sans-serif] font-bold leading-[1.2] relative shrink-0 text-[#030404] text-[32px] tracking-[0.32px] w-full" style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 1" }}>
                        No more hallucinations
                      </p>
                      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.6] not-italic relative shrink-0 text-[#030404] text-[18px] w-full">{`AI that sees the whole picture, not just what's in one tool.`}</p>
                      <div className="content-stretch flex flex-col items-start pt-[8px] relative shrink-0 w-full" data-name="Action">
                        <ButtonText text="Arrow" />
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex gap-[24px] items-start relative shrink-0 w-full" data-name="List Item">
                    <div className="relative shrink-0 size-[48px]" data-name="stack">
                      <div className="absolute inset-[7.69%_7.69%_7.71%_7.69%]" data-name="Vector">
                        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 40.622 40.61">
                          <path d={svgPaths.p35714500} fill="var(--fill-0, #030404)" id="Vector" />
                        </svg>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-h-px min-w-px relative" data-name="Content">
                      <p className="font-['Fraunces:Bold',sans-serif] font-bold leading-[1.2] relative shrink-0 text-[#030404] text-[32px] tracking-[0.32px] w-full" style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 1" }}>
                        No more fragmentation
                      </p>
                      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.6] not-italic relative shrink-0 text-[#030404] text-[18px] w-full">One unified truth layer instead of six tools and a spreadsheet.</p>
                      <div className="content-stretch flex flex-col items-start pt-[8px] relative shrink-0 w-full" data-name="Action">
                        <ButtonText text="Arrow" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="aspect-[600/640] flex-[1_0_0] min-h-px min-w-px relative rounded-[8px]" data-name="Placeholder Image">
                  <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[8px] size-full" src={imgPlaceholderImage5} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white relative shrink-0 w-full" data-name="CTA / 31 /">
        <div className="flex flex-col items-center overflow-clip rounded-[inherit] size-full">
          <div className="content-stretch flex flex-col items-center px-[64px] py-[112px] relative w-full">
            <div className="content-stretch flex flex-col gap-[80px] items-center max-w-[1280px] relative shrink-0 w-full" data-name="Container">
              <div className="content-stretch flex flex-col gap-[32px] items-center max-w-[768px] relative shrink-0 w-full" data-name="Content">
                <div className="content-stretch flex flex-col gap-[24px] items-center relative shrink-0 text-[#030404] text-center w-full" data-name="Content">
                  <p className="font-['Fraunces:Bold',sans-serif] font-bold leading-[1.2] relative shrink-0 text-[60px] tracking-[0.6px] w-full" style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 1" }}>
                    See your accounts clearly
                  </p>
                  <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.6] not-italic relative shrink-0 text-[20px] w-full">{`In 20 minutes, we'll assemble Entity 360 for one real account and show you signals you don't see today.`}</p>
                </div>
                <Actions text="Try" additionalClassNames="px-[12px] py-[6px]" />
              </div>
              <div className="aspect-[1280/738] relative rounded-[8px] shrink-0 w-full" data-name="Placeholder Image">
                <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[8px] size-full" src={imgPlaceholderImage6} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white relative shrink-0 w-full" data-name="Testimonial / 6 /">
        <div className="flex flex-col items-center overflow-clip rounded-[inherit] size-full">
          <div className="content-stretch flex flex-col items-center px-[64px] py-[112px] relative w-full">
            <div className="content-stretch flex flex-col gap-[80px] items-start max-w-[1280px] relative shrink-0 w-full" data-name="Container">
              <div className="content-stretch flex flex-col gap-[24px] items-start max-w-[768px] relative shrink-0 text-[#030404] w-full" data-name="Section Title">
                <p className="font-['Fraunces:Bold',sans-serif] font-bold leading-[1.2] relative shrink-0 text-[60px] tracking-[0.6px] w-full" style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 1" }}>
                  From teams
                </p>
                <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.6] not-italic relative shrink-0 text-[20px] w-full">{`Who've seen the difference`}</p>
              </div>
              <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Content">
                <div className="content-stretch flex gap-[32px] items-start relative shrink-0 w-full" data-name="Row">
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[32px] items-start min-h-px min-w-px overflow-clip relative" data-name="Column">
                    <Stars />
                    <p className="font-['Fraunces:Bold',sans-serif] font-bold leading-[1.2] min-w-full relative shrink-0 text-[#030404] text-[26px] tracking-[0.26px] w-[min-content]" style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 1" }}>{`"We caught a $2M account at risk three months before we would have seen it in Salesforce."`}</p>
                    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0" data-name="Avatar">
                      <div className="relative shrink-0 size-[56px]" data-name="Avatar Image">
                        <img alt="" className="absolute block max-w-none size-full" height="56" src={imgAvatarImage} width="56" />
                      </div>
                      <AvatarContent text="Sarah Chen" text1="VP Customer Success, SaaS" />
                      <PlaceholderLogo />
                    </div>
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[32px] items-start min-h-px min-w-px overflow-clip relative" data-name="Column">
                    <Stars />
                    <p className="font-['Fraunces:Bold',sans-serif] font-bold leading-[1.2] min-w-full relative shrink-0 text-[#030404] text-[26px] tracking-[0.26px] w-[min-content]" style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 1" }}>{`"Our new CSMs ramp in half the time. The Spine shows them everything they need to know."`}</p>
                    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0" data-name="Avatar">
                      <div className="relative shrink-0 size-[56px]" data-name="Avatar Image">
                        <img alt="" className="absolute block max-w-none size-full" height="56" src={imgAvatarImage1} width="56" />
                      </div>
                      <AvatarContent text="Marcus Rodriguez" text1="Head of RevOps, B2B" />
                      <PlaceholderLogo />
                    </div>
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[32px] items-start min-h-px min-w-px overflow-clip relative" data-name="Column">
                    <Stars />
                    <p className="font-['Fraunces:Bold',sans-serif] font-bold leading-[1.2] min-w-full relative shrink-0 text-[#030404] text-[26px] tracking-[0.26px] w-[min-content]" style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 1" }}>{`"Finally, an AI that doesn't make things up. It shows its work and waits for us to decide."`}</p>
                    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0" data-name="Avatar">
                      <div className="relative shrink-0 size-[56px]" data-name="Avatar Image">
                        <img alt="" className="absolute block max-w-none size-full" height="56" src={imgAvatarImage2} width="56" />
                      </div>
                      <AvatarContent text="Elena Vasquez" text1="Founder, SaaS startup" />
                      <PlaceholderLogo />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-[#e1e7ed] relative shrink-0 w-full" data-name="FAQ / 4 /">
        <div className="flex flex-col items-center overflow-clip rounded-[inherit] size-full">
          <div className="content-stretch flex flex-col items-center px-[64px] py-[112px] relative w-full">
            <div className="content-stretch flex flex-col gap-[80px] items-center max-w-[1280px] relative shrink-0 w-full" data-name="Container">
              <Helper text="FAQ" text1="Questions about how IntegrateWise works and what it can do for your team" additionalClassNames="max-w-[768px]" />
              <div className="content-stretch flex flex-col gap-[16px] items-start max-w-[768px] relative shrink-0 w-full" data-name="Accordion List">
                <div className="bg-[#e1e7ed] content-stretch flex flex-col items-start relative rounded-[8px] shrink-0 w-full" data-name="Accordion">
                  <div aria-hidden="true" className="absolute border border-[rgba(3,4,4,0.15)] border-solid inset-0 pointer-events-none rounded-[8px]" />
                  <QuestionText text="How secure is the Spine?" />
                  <AnswerText text="Data is encrypted in transit and at rest. The Spine normalizes your data but never stores it outside your control. You own the truth layer. We provide the intelligence." />
                </div>
                <div className="bg-[#e1e7ed] content-stretch flex flex-col items-start relative rounded-[8px] shrink-0 w-full" data-name="Accordion">
                  <div aria-hidden="true" className="absolute border border-[rgba(3,4,4,0.15)] border-solid inset-0 pointer-events-none rounded-[8px]" />
                  <QuestionText text="Can you connect our stack?" />
                  <Wrapper>{`We have 50+ native connectors and 30+ webhooks. If your tool has an API, we can connect it. If not, we'll build it. Your entire stack flows through the Spine.`}</Wrapper>
                </div>
                <div className="bg-[#e1e7ed] content-stretch flex flex-col items-start relative rounded-[8px] shrink-0 w-full" data-name="Accordion">
                  <div aria-hidden="true" className="absolute border border-[rgba(3,4,4,0.15)] border-solid inset-0 pointer-events-none rounded-[8px]" />
                  <QuestionText text="What if the AI is wrong?" />
                  <AnswerText text="The AI proposes; you approve. Every action requires human judgment. When you approve or reject, the system learns. Over time, it gets better at understanding your business." />
                </div>
                <div className="bg-[#e1e7ed] content-stretch flex flex-col items-start relative rounded-[8px] shrink-0 w-full" data-name="Accordion">
                  <div aria-hidden="true" className="absolute border border-[rgba(3,4,4,0.15)] border-solid inset-0 pointer-events-none rounded-[8px]" />
                  <QuestionText text="How long is implementation?" />
                  <AnswerText text="Most teams see signals within two weeks. Full integration depends on your stack complexity, but we handle the heavy lifting. You focus on using the intelligence." />
                </div>
                <div className="bg-[#e1e7ed] content-stretch flex flex-col items-start relative rounded-[8px] shrink-0 w-full" data-name="Accordion">
                  <div aria-hidden="true" className="absolute border border-[rgba(3,4,4,0.15)] border-solid inset-0 pointer-events-none rounded-[8px]" />
                  <QuestionText text="Does it replace our tools?" />
                  <AnswerText text="No. IntegrateWise sits on top of your stack. Salesforce, HubSpot, Slack, and everything else stays in place. The Spine connects them and makes them smarter together." />
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[24px] items-center max-w-[560px] relative shrink-0 w-full" data-name="Content">
                <div className="content-stretch flex flex-col gap-[16px] items-center relative shrink-0 text-[#030404] text-center w-full" data-name="Content">
                  <p className="font-['Fraunces:Bold',sans-serif] font-bold leading-[1.2] relative shrink-0 text-[40px] tracking-[0.4px] w-full" style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 1" }}>
                    Still have questions
                  </p>
                  <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.6] not-italic relative shrink-0 text-[20px] w-full">Reach out to our team anytime</p>
                </div>
                <div className="content-stretch flex items-center relative shrink-0" data-name="Actions">
                  <Button>
                    <Text text="Contact" additionalClassNames="px-[12px] py-[6px]" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white relative shrink-0 w-full" data-name="CTA / 58 /">
        <div className="flex flex-col items-center overflow-clip rounded-[inherit] size-full">
          <div className="content-stretch flex flex-col items-center px-[64px] py-[112px] relative w-full">
            <div className="content-stretch flex flex-col items-center max-w-[1280px] relative shrink-0 w-full" data-name="Container">
              <div className="content-stretch flex flex-col gap-[32px] items-center max-w-[768px] relative shrink-0 w-full" data-name="Column">
                <div className="content-stretch flex flex-col gap-[24px] items-center relative shrink-0 text-[#030404] text-center w-full" data-name="Content">
                  <div className="content-stretch flex flex-col font-['Fraunces:Bold',sans-serif] font-bold items-center leading-[1.1] relative shrink-0 text-[84px] tracking-[0.84px]" data-name="Heading">
                    <p className="relative shrink-0 w-[768px]" style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 1" }}>
                      Stay informed
                    </p>
                    <p className="relative shrink-0 w-[768px]" style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 1" }}>
                      on intelligent work
                    </p>
                  </div>
                  <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.6] min-w-full not-italic relative shrink-0 text-[20px] w-[min-content]">Get updates on how teams are using the Spine to see what matters and act with confidence.</p>
                </div>
                <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-[513px]" data-name="Actions">
                  <div className="content-stretch flex gap-[16px] items-start relative shrink-0 w-full" data-name="Form">
                    <div className="bg-[rgba(255,255,255,0)] flex-[1_0_0] min-h-px min-w-px relative" data-name="Text input">
                      <div aria-hidden="true" className="absolute border-[rgba(3,4,4,0.15)] border-b border-solid inset-[0_0_-1px_0] pointer-events-none" />
                      <div className="flex flex-row items-center size-full">
                        <div className="content-stretch flex items-center py-[8px] relative w-full">
                          <p className="flex-[1_0_0] font-['Inter:Regular',sans-serif] font-normal leading-[1.6] min-h-px min-w-px not-italic relative text-[18px] text-[rgba(3,4,4,0.6)]">Enter your email</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-[#6a89a7] relative rounded-[6px] shrink-0" data-name="Button">
                      <div aria-hidden="true" className="absolute border border-[#6a89a7] border-solid inset-[-1px] pointer-events-none rounded-[7px]" />
                      <div className="flex flex-row items-center justify-center size-full">
                        <Text1 text="Subscribe" additionalClassNames="px-[12px] py-[6px]" />
                      </div>
                    </div>
                  </div>
                  <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.6] not-italic relative shrink-0 text-[#030404] text-[12px] text-center w-full">By subscribing, you agree to our Terms and Conditions.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-[#2c3a47] relative shrink-0 w-full" data-name="Footer / 3 /">
        <div className="flex flex-col items-center overflow-clip rounded-[inherit] size-full">
          <div className="content-stretch flex flex-col items-center px-[64px] py-[80px] relative w-full">
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
    </div>
  );
}