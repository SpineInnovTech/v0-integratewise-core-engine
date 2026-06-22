import clsx from "clsx";
import svgPaths from "./svg-dhl3oqsob5";

function Container1({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative rounded-[16777200px] w-[28px]">
      <div aria-hidden="true" className="absolute border-2 border-[#d8dee8] border-solid inset-0 pointer-events-none rounded-[16777200px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center px-[7px] py-[2px] relative size-full">{children}</div>
    </div>
  );
}
type ContainerProps = {
  additionalClassNames?: string;
};

function Container({ children, additionalClassNames = "" }: React.PropsWithChildren<ContainerProps>) {
  return (
    <div className={clsx("h-[48.5px] relative shrink-0", additionalClassNames)}>
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[7px] items-center relative size-full">{children}</div>
    </div>
  );
}
type WrapperProps = {
  additionalClassNames?: string;
};

function Wrapper({ children, additionalClassNames = "" }: React.PropsWithChildren<WrapperProps>) {
  return (
    <div className={clsx("size-[14px]", additionalClassNames)}>
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        {children}
      </svg>
    </div>
  );
}
type IconProps = {
  additionalClassNames?: string;
};

function Icon({ children, additionalClassNames = "" }: React.PropsWithChildren<IconProps>) {
  return (
    <Wrapper additionalClassNames={additionalClassNames}>
      <g id="Icon">{children}</g>
    </Wrapper>
  );
}
type InputTextProps = {
  text: string;
};

function InputText({ text }: InputTextProps) {
  return (
    <div className="absolute bg-white h-[49px] left-0 rounded-[5px] top-[21px] w-[504px]">
      <div className="content-stretch flex items-center overflow-clip px-[10.5px] py-[3.5px] relative rounded-[inherit] size-full">
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[#64748b] text-[12.25px] tracking-[-0.0179px] whitespace-nowrap">{text}</p>
      </div>
      <div aria-hidden="true" className="absolute border border-[#d8dee8] border-solid inset-0 pointer-events-none rounded-[5px]" />
    </div>
  );
}
type LabelTextProps = {
  text: string;
  additionalClassNames?: string;
};

function LabelText({ text, additionalClassNames = "" }: LabelTextProps) {
  return (
    <div className={clsx("absolute content-stretch flex h-[11.5px] items-start left-0 top-[6px]", additionalClassNames)}>
      <p className="font-['Inter:Bold',sans-serif] font-bold leading-[15px] not-italic relative shrink-0 text-[#64748b] text-[10px] tracking-[0.6172px] uppercase whitespace-nowrap">{text}</p>
    </div>
  );
}
type TextTextProps = {
  text: string;
  additionalClassNames?: string;
};

function TextText({ text, additionalClassNames = "" }: TextTextProps) {
  return (
    <div className={clsx("h-[13.5px] relative shrink-0", additionalClassNames)}>
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[13.5px] left-0 not-italic text-[#b0b8c5] text-[9px] top-[0.5px] tracking-[1.067px] uppercase whitespace-nowrap">{text}</p>
      </div>
    </div>
  );
}

export default function IntegratewiseLive() {
  return (
    <div className="bg-[#f5f6fa] relative size-full" data-name="Integratewise-live">
      <div className="absolute bg-[#f5f6fa] h-[542.5px] left-0 top-0 w-[963px]" data-name="OnboardingFlow">
        <div className="absolute h-[500.5px] left-[229.5px] top-[21px] w-[504px]" data-name="Container">
          <div className="absolute content-stretch flex h-[46px] items-center justify-center left-0 px-[202px] top-0 w-[504px]" data-name="Container">
            <div className="h-[46px] relative shrink-0 w-[100px]" data-name="LogoMark">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 100 46">
                <g clipPath="url(#clip0_637_5735)" id="LogoMark">
                  <path d={svgPaths.p74d2f80} fill="var(--fill-0, #4256AB)" id="Vector" />
                  <path d={svgPaths.p226f8a00} fill="var(--fill-0, #4152A1)" id="Vector_2" />
                  <path d={svgPaths.p1c8b8000} fill="var(--fill-0, #4256AB)" id="Vector_3" />
                  <path d={svgPaths.p3814bf10} fill="var(--fill-0, #EE4B75)" id="Vector_4" />
                </g>
                <defs>
                  <clipPath id="clip0_637_5735">
                    <rect fill="white" height="46" width="100" />
                  </clipPath>
                </defs>
              </svg>
            </div>
          </div>
          <div className="absolute content-stretch flex h-[48.5px] items-center justify-between left-0 px-[7px] top-[74px] w-[504px]" data-name="Container">
            <Container additionalClassNames="w-[51.766px]">
              <div className="bg-[#4256ab] flex-[1_0_0] min-h-px min-w-px relative rounded-[16777200px] w-[28px]" data-name="Container">
                <div aria-hidden="true" className="absolute border-2 border-[#4256ab] border-solid inset-0 pointer-events-none rounded-[16777200px]" />
                <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center px-[7px] py-[2px] relative size-full">
                  <Wrapper additionalClassNames="relative shrink-0">
                    <g clipPath="url(#clip0_637_5741)" id="Icon">
                      <path d={svgPaths.p2f03b200} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                      <path d={svgPaths.p1e0c2e80} id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                      <path d={svgPaths.p8dd880} id="Vector_3" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                      <path d={svgPaths.p7d50f00} id="Vector_4" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                    </g>
                    <defs>
                      <clipPath id="clip0_637_5741">
                        <rect fill="white" height="14" width="14" />
                      </clipPath>
                    </defs>
                  </Wrapper>
                </div>
              </div>
              <div className="h-[13.5px] relative shrink-0 w-[51.766px]" data-name="Text">
                <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
                  <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[13.5px] left-0 not-italic text-[#4256ab] text-[9px] top-[0.5px] tracking-[1.067px] uppercase whitespace-nowrap">Identity</p>
                </div>
              </div>
            </Container>
            <Container additionalClassNames="w-[50.195px]">
              <Container1>
                <Wrapper additionalClassNames="relative shrink-0">
                  <g clipPath="url(#clip0_637_5758)" id="Icon">
                    <path d={svgPaths.pc012c00} id="Vector" stroke="var(--stroke-0, #64748B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                    <path d={svgPaths.p1426c1f0} id="Vector_2" stroke="var(--stroke-0, #64748B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                    <path d={svgPaths.p206e4880} id="Vector_3" stroke="var(--stroke-0, #64748B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                  </g>
                  <defs>
                    <clipPath id="clip0_637_5758">
                      <rect fill="white" height="14" width="14" />
                    </clipPath>
                  </defs>
                </Wrapper>
              </Container1>
              <TextText text="Org DNA" additionalClassNames="w-[50.195px]" />
            </Container>
            <Container additionalClassNames="w-[52.18px]">
              <Container1>
                <Wrapper additionalClassNames="relative shrink-0">
                  <g clipPath="url(#clip0_637_5753)" id="Icon">
                    <path d={svgPaths.pc012c00} id="Vector" stroke="var(--stroke-0, #64748B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                    <path d={svgPaths.p21d23a70} id="Vector_2" stroke="var(--stroke-0, #64748B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                    <path d="M1.16667 7H12.8333" id="Vector_3" stroke="var(--stroke-0, #64748B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                  </g>
                  <defs>
                    <clipPath id="clip0_637_5753">
                      <rect fill="white" height="14" width="14" />
                    </clipPath>
                  </defs>
                </Wrapper>
              </Container1>
              <TextText text="Context" additionalClassNames="w-[52.18px]" />
            </Container>
            <Container additionalClassNames="w-[53.125px]">
              <Container1>
                <Icon additionalClassNames="relative shrink-0">
                  <path d={svgPaths.p15384580} id="Vector" stroke="var(--stroke-0, #64748B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                  <path d={svgPaths.p77eed00} id="Vector_2" stroke="var(--stroke-0, #64748B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                  <path d={svgPaths.p1e7c0380} id="Vector_3" stroke="var(--stroke-0, #64748B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                </Icon>
              </Container1>
              <TextText text="Connect" additionalClassNames="w-[53.125px]" />
            </Container>
            <Container additionalClassNames="w-[32.859px]">
              <Container1>
                <Icon additionalClassNames="relative shrink-0">
                  <path d={svgPaths.p33035500} id="Vector" stroke="var(--stroke-0, #64748B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                </Icon>
              </Container1>
              <TextText text="Spine" additionalClassNames="w-[32.859px]" />
            </Container>
          </div>
          <div className="absolute content-stretch flex flex-col gap-[28px] h-[245px] items-start left-0 top-[164.5px] w-[504px]" data-name="Container">
            <div className="content-stretch flex flex-col gap-[7px] h-[63px] items-start relative shrink-0 w-full" data-name="OnboardingFlow">
              <div className="h-[35px] relative shrink-0 w-full" data-name="Heading 1">
                <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[35px] left-0 not-italic text-[#102a43] text-[31.5px] top-0 tracking-[-0.3838px] whitespace-nowrap">Welcome to IntegrateWise.</p>
              </div>
              <div className="h-[21px] relative shrink-0 w-full" data-name="Paragraph">
                <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-0 not-italic text-[#64748b] text-[14px] top-0 tracking-[-0.1504px] whitespace-nowrap">Establish your operational identity to begin Spine normalization.</p>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[14px] h-[154px] items-start relative shrink-0 w-full" data-name="OnboardingFlow">
              <div className="h-[70px] relative shrink-0 w-full" data-name="Container">
                <LabelText text="Full Name" additionalClassNames="w-[63.906px]" />
                <InputText text="e.g. Arun Kumar" />
              </div>
              <div className="h-[70px] relative shrink-0 w-full" data-name="Container">
                <LabelText text="Job Role" additionalClassNames="w-[55.305px]" />
                <InputText text="Operations Lead" />
              </div>
            </div>
          </div>
          <div className="absolute content-stretch flex h-[49px] items-center justify-between left-0 pl-[389.32px] top-[451.5px] w-[504px]" data-name="Container">
            <div className="bg-[#ee4b75] h-[49px] opacity-50 relative rounded-[14px] shadow-[0px_10px_15px_0px_rgba(238,75,117,0.2),0px_4px_6px_0px_rgba(238,75,117,0.2)] shrink-0 w-[114.68px]" data-name="Button">
              <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
                <p className="-translate-x-1/2 absolute font-['Inter:Bold',sans-serif] font-bold leading-[17.5px] left-[45.5px] not-italic text-[12.25px] text-center text-white top-[16.25px] tracking-[-0.0179px] whitespace-nowrap">Next Phase</p>
                <Icon additionalClassNames="absolute left-[90.18px] top-[17.5px]">
                  <path d="M5.25 10.5L8.75 7L5.25 3.5" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                </Icon>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute h-[530px] left-0 opacity-30 overflow-clip top-0 w-[963px]" data-name="OnboardingFlow">
        <div className="absolute bg-[#4256ab] blur-[120px] h-[212px] left-[-96.3px] opacity-60 rounded-[16777200px] top-[-53px] w-[385.195px]" data-name="Container" />
        <div className="absolute bg-[#ee4b75] blur-[120px] h-[212px] left-[674.1px] rounded-[16777200px] top-[371px] w-[385.195px]" data-name="Container" />
      </div>
    </div>
  );
}