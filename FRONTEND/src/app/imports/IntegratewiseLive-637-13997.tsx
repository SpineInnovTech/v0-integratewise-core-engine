import clsx from "clsx";
import svgPaths from "./svg-h3qqrlqimm";

function Link({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="bg-[#f8fafc] relative rounded-[16777200px] shrink-0 size-[35px]">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center px-[8.75px] relative size-full">{children}</div>
    </div>
  );
}

function Wrapper2({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="h-[21px] relative shrink-0 w-full">
      <Wrapper additionalClassNames="absolute left-0 top-[1.75px]">
        <path d={svgPaths.p1e3dd400} id="Vector" stroke="var(--stroke-0, #EE4B75)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.45833" />
      </Wrapper>
      <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[21px] left-[28px] not-italic text-[#314158] text-[14px] top-0 tracking-[-0.1504px] whitespace-nowrap">{children}</p>
    </div>
  );
}
type Wrapper1Props = {
  additionalClassNames?: string;
};

function Wrapper1({ children, additionalClassNames = "" }: React.PropsWithChildren<Wrapper1Props>) {
  return (
    <div className={clsx("h-[21px] relative shrink-0", additionalClassNames)}>
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">{children}</div>
    </div>
  );
}
type WrapperProps = {
  additionalClassNames?: string;
};

function Wrapper({ children, additionalClassNames = "" }: React.PropsWithChildren<WrapperProps>) {
  return (
    <div className={clsx("size-[17.5px]", additionalClassNames)}>
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.5 17.5">
        <g id="Icon">{children}</g>
      </svg>
    </div>
  );
}
type Text2Props = {
  text: string;
  additionalClassNames?: string;
};

function Text2({ text, additionalClassNames = "" }: Text2Props) {
  return (
    <div className={clsx("h-[17.5px] relative", additionalClassNames)}>
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[17.5px] left-0 not-italic text-[#90a1b9] text-[12.25px] top-[0.5px] tracking-[-0.0179px] whitespace-nowrap">{text}</p>
      </div>
    </div>
  );
}
type Text1Props = {
  text: string;
};

function Text1({ text }: Text1Props) {
  return (
    <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-0 not-italic text-[#62748e] text-[14px] top-0 tracking-[-0.1504px] whitespace-nowrap">{text}</p>
    </div>
  );
}
type TextProps = {
  text: string;
};

function Text({ text }: TextProps) {
  return (
    <div className="h-[21px] relative shrink-0 w-full">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-0 not-italic text-[#62748e] text-[14px] top-0 tracking-[-0.1504px] whitespace-nowrap">{text}</p>
    </div>
  );
}
type HeadingText1Props = {
  text: string;
};

function HeadingText1({ text }: HeadingText1Props) {
  return (
    <div className="h-[21px] relative shrink-0 w-full">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[21px] left-0 not-italic text-[#0f172b] text-[14px] top-0 tracking-[-0.1504px] whitespace-nowrap">{text}</p>
    </div>
  );
}
type ListItemText1Props = {
  text: string;
};

function ListItemText1({ text }: ListItemText1Props) {
  return (
    <div className="h-[22.05px] relative shrink-0 w-full">
      <div className="absolute left-0 size-[18.375px] top-[1.84px]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.375 18.375">
          <g id="Icon">
            <path d={svgPaths.p387e0a20} id="Vector" stroke="var(--stroke-0, #EE4B75)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.53125" />
          </g>
        </svg>
      </div>
      <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[21px] left-[29.4px] not-italic text-[#314158] text-[14px] top-[0.1px] tracking-[-0.1504px] whitespace-nowrap">{text}</p>
    </div>
  );
}
type ListItemTextProps = {
  text: string;
};

function ListItemText({ text }: ListItemTextProps) {
  return <Wrapper2>{text}</Wrapper2>;
}
type HelperProps = {
  text: string;
  text1: string;
  additionalClassNames?: string;
};

function Helper({ text, text1, additionalClassNames = "" }: HelperProps) {
  return (
    <p className={clsx("absolute font-['Inter:Black',sans-serif] font-black leading-[0] left-0 not-italic text-[#4152a1] text-[0px] tracking-[0.4037px] whitespace-nowrap", additionalClassNames)}>
      <span className="leading-[35px] text-[31.5px]">{text}</span>
      <span className="font-['Inter:Regular',sans-serif] font-normal leading-[21px] text-[#62748e] text-[14px] tracking-[-0.1504px]">{text1}</span>
    </p>
  );
}
type ContainerProps = {
  text: string;
  text1: string;
  additionalClassNames?: string;
};

function Container({ text, text1, additionalClassNames = "" }: ContainerProps) {
  return (
    <div className={clsx("absolute h-[35px] left-[35px] top-[70px]", additionalClassNames)}>
      <Helper text={text} text1={text1} additionalClassNames="top-[-3px]" />
    </div>
  );
}
type HeadingTextProps = {
  text: string;
  additionalClassNames?: string;
};

function HeadingText({ text, additionalClassNames = "" }: HeadingTextProps) {
  return (
    <div className={clsx("absolute h-[28px] left-[35px] top-[35px]", additionalClassNames)}>
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[28px] left-0 not-italic text-[#1d293d] text-[21px] top-[-0.5px] tracking-[-0.3589px] whitespace-nowrap">{text}</p>
    </div>
  );
}

export default function IntegratewiseLive() {
  return (
    <div className="bg-[#f5f6fa] relative size-full" data-name="Integratewise-live">
      <div className="absolute bg-white content-stretch flex flex-col h-[1840.313px] items-start left-0 top-0 w-[963px]" data-name="App">
        <div className="bg-white content-stretch flex flex-col h-[1244.313px] items-start pt-[154px] relative shrink-0 w-full" data-name="Layout">
          <div className="bg-[#f8fafc] h-[1006.313px] relative shrink-0 w-full" data-name="Pricing">
            <div className="absolute content-stretch flex flex-col gap-[14px] h-[73.5px] items-start left-[21px] top-0 w-[921px]" data-name="Container">
              <div className="h-[35px] relative shrink-0 w-full" data-name="Heading 2">
                <p className="-translate-x-1/2 absolute font-['Inter:Extra_Bold',sans-serif] font-extrabold leading-[35px] left-[461.38px] not-italic text-[#4152a1] text-[31.5px] text-center top-0 tracking-[0.4037px] whitespace-nowrap">Simple, value‑aligned pricing</p>
              </div>
              <div className="h-[24.5px] relative shrink-0 w-full" data-name="Paragraph">
                <p className="-translate-x-1/2 absolute font-['Inter:Regular',sans-serif] font-normal leading-[24.5px] left-[461.4px] not-italic text-[#45556c] text-[15.75px] text-center top-0 tracking-[-0.2922px] whitespace-nowrap">Scales with your success, not just your tool count.</p>
              </div>
            </div>
            <div className="absolute h-[499px] left-[21px] top-[129.5px] w-[921px]" data-name="Container">
              <div className="absolute bg-white border border-[#e2e8f0] border-solid h-[499px] left-0 rounded-[21px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_0px_rgba(0,0,0,0.1)] top-0 w-[288.328px]" data-name="Container">
                <HeadingText text="Starter" additionalClassNames="w-[216.328px]" />
                <Container text="$49" text1="/user/month" additionalClassNames="w-[216.328px]" />
                <div className="absolute h-[63px] left-[35px] top-[126px] w-[216.328px]" data-name="Paragraph">
                  <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-0 not-italic text-[#45556c] text-[14px] top-0 tracking-[-0.1504px] w-[194px]">Core integrations, basic intelligence, ideal for small CS teams.</p>
                </div>
                <div className="absolute content-stretch flex flex-col gap-[14px] h-[161px] items-start left-[35px] top-[217px] w-[216.328px]" data-name="List">
                  <ListItemText text="Up to 5 integrations" />
                  <ListItemText text="L0-L1 Truth Layer" />
                  <ListItemText text="Basic health scoring" />
                  <ListItemText text="Email support" />
                </div>
                <div className="absolute bg-[#f1f5f9] h-[49px] left-[35px] rounded-[11px] top-[413px] w-[216.328px]" data-name="Button">
                  <p className="-translate-x-1/2 absolute font-['Inter:Bold',sans-serif] font-bold leading-[21px] left-[108.4px] not-italic text-[#314158] text-[14px] text-center top-[14px] tracking-[-0.1504px] whitespace-nowrap">Start with Starter</p>
                </div>
              </div>
              <div className="absolute bg-white border border-[#4256ab] border-solid h-[523.95px] left-[309.12px] rounded-[21px] shadow-[0px_25px_50px_0px_rgba(0,0,0,0.25)] top-[-12.47px] w-[302.4px]" data-name="Container">
                <div className="absolute h-[29.4px] left-[35px] top-[35px] w-[227.153px]" data-name="Heading 3">
                  <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[28px] left-0 not-italic text-[#1d293d] text-[21px] top-[-0.42px] tracking-[-0.3589px] whitespace-nowrap">Growth</p>
                </div>
                <div className="absolute h-[36.75px] left-[35px] top-[70px] w-[227.153px]" data-name="Container">
                  <Helper text="$99" text1="/user/month" additionalClassNames="top-[-3.05px]" />
                </div>
                <div className="absolute h-[66.15px] left-[35px] top-[126px] w-[227.153px]" data-name="Paragraph">
                  <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-0 not-italic text-[#45556c] text-[14px] top-[0.1px] tracking-[-0.1504px] w-[184px]">Full L0–L3 intelligence, dual‑context metrics, edge correction engine.</p>
                </div>
                <div className="absolute content-stretch flex flex-col gap-[14.7px] h-[169.05px] items-start left-[35px] top-[217px] w-[227.153px]" data-name="List">
                  <ListItemText1 text="Unlimited integrations" />
                  <ListItemText1 text="Full L0-L3 Architecture" />
                  <ListItemText1 text="Dual-context intelligence" />
                  <ListItemText1 text="Edge Correction Library" />
                  <ListItemText1 text="Priority support" />
                </div>
                <div className="absolute bg-[#ee4b75] h-[51.45px] left-[35px] rounded-[11px] shadow-[0px_10px_15px_0px_rgba(238,75,117,0.2),0px_4px_6px_0px_rgba(238,75,117,0.2)] top-[413px] w-[227.153px]" data-name="Button">
                  <p className="-translate-x-1/2 absolute font-['Inter:Bold',sans-serif] font-bold leading-[21px] left-[113.46px] not-italic text-[14px] text-center text-white top-[14.8px] tracking-[-0.1504px] whitespace-nowrap">Start with Growth</p>
                </div>
                <div className="absolute bg-[#4256ab] h-[22.05px] left-[79.25px] rounded-[16777200px] top-[-14px] w-[134.228px]" data-name="Container">
                  <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[14px] left-[14.7px] not-italic text-[10.5px] text-white top-[3.73px] tracking-[1.1423px] uppercase whitespace-nowrap">Most Popular</p>
                </div>
              </div>
              <div className="absolute bg-white border border-[#e2e8f0] border-solid h-[499px] left-[632.66px] rounded-[21px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_0px_rgba(0,0,0,0.1)] top-0 w-[288.336px]" data-name="Container">
                <HeadingText text="Enterprise" additionalClassNames="w-[216.336px]" />
                <Container text="Contact" text1="/for pricing" additionalClassNames="w-[216.336px]" />
                <div className="absolute h-[63px] left-[35px] top-[126px] w-[216.336px]" data-name="Paragraph">
                  <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-0 not-italic text-[#45556c] text-[14px] top-0 tracking-[-0.1504px] w-[202px]">Custom integrations, advanced controls, and full‑company rollouts.</p>
                </div>
                <div className="absolute content-stretch flex flex-col gap-[14px] h-[161px] items-start left-[35px] top-[217px] w-[216.336px]" data-name="List">
                  <ListItemText text="Custom deployment" />
                  <Wrapper2>{`RBAC & SSO`}</Wrapper2>
                  <ListItemText text="Dedicated CSM" />
                  <ListItemText text="Custom L3 Intelligence rules" />
                  <ListItemText text="24/7 SLA" />
                </div>
                <div className="absolute bg-[#f1f5f9] h-[49px] left-[35px] rounded-[11px] top-[413px] w-[216.336px]" data-name="Button">
                  <p className="-translate-x-1/2 absolute font-['Inter:Bold',sans-serif] font-bold leading-[21px] left-[108.41px] not-italic text-[#314158] text-[14px] text-center top-[14px] tracking-[-0.1504px] whitespace-nowrap">Talk to Sales</p>
                </div>
              </div>
            </div>
            <div className="absolute bg-[#4152a1] h-[307.813px] left-[21px] rounded-[21px] top-[698.5px] w-[921px]" data-name="Container">
              <div className="absolute content-stretch flex h-[31.5px] items-start left-[42px] top-[42px] w-[837px]" data-name="Heading 3">
                <p className="flex-[1_0_0] font-['Inter:Bold',sans-serif] font-bold leading-[31.5px] min-h-px min-w-px not-italic relative text-[26.25px] text-center text-white tracking-[0.2355px]">The window is open — for a limited time</p>
              </div>
              <div className="absolute h-[85.313px] left-[124.5px] top-[94.5px] w-[672px]" data-name="Paragraph">
                <p className="-translate-x-1/2 absolute font-['Inter:Regular',sans-serif] font-normal leading-[28.438px] left-[336.02px] not-italic text-[17.5px] text-[rgba(255,255,255,0.8)] text-center top-[-0.5px] tracking-[-0.4358px] w-[667px]">Incumbents will add AI layers. New tools will copy parts of the architecture. What they can’t copy quickly are years of dual‑context data, edge corrections, and customer trust.</p>
              </div>
              <div className="absolute content-stretch flex gap-[14px] h-[51px] items-start justify-center left-[42px] px-[161.273px] top-[214.81px] w-[837px]" data-name="Container">
                <div className="bg-[#ee4b75] h-[51px] relative rounded-[16777200px] shadow-[0px_20px_25px_0px_rgba(0,0,0,0.2),0px_8px_10px_0px_rgba(0,0,0,0.2)] shrink-0 w-[220.078px]" data-name="Button">
                  <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
                    <p className="-translate-x-1/2 absolute font-['Inter:Bold',sans-serif] font-bold leading-[21px] left-[110px] not-italic text-[14px] text-center text-white top-[15px] tracking-[-0.1504px] whitespace-nowrap">Book a strategy session</p>
                  </div>
                </div>
                <div className="bg-[rgba(255,255,255,0.1)] h-[51px] relative rounded-[16777200px] shrink-0 w-[280.375px]" data-name="Button">
                  <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.2)] border-solid inset-0 pointer-events-none rounded-[16777200px]" />
                  <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
                    <p className="-translate-x-1/2 absolute font-['Inter:Bold',sans-serif] font-bold leading-[21px] left-[140px] not-italic text-[14px] text-center text-white top-[15px] tracking-[-0.1504px] whitespace-nowrap">Start a pilot with your CSM team</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white content-stretch flex flex-col h-[596px] items-start pt-[71px] relative shrink-0 w-full" data-name="Footer">
          <div aria-hidden="true" className="absolute border-[#f1f5f9] border-solid border-t inset-0 pointer-events-none" />
          <div className="h-[490px] relative shrink-0 w-full" data-name="Container">
            <div className="content-stretch flex flex-col gap-[56px] items-start px-[21px] relative size-full">
              <div className="h-[387.5px] relative shrink-0 w-full" data-name="Container">
                <div className="absolute content-stretch flex flex-col gap-[21px] h-[177.5px] items-start left-0 top-0 w-[439.5px]" data-name="Container">
                  <div className="content-stretch flex h-[55px] items-center relative shrink-0 w-full" data-name="Container">
                    <div className="h-[55px] relative shrink-0 w-[120px]" data-name="Logo">
                      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 120 55">
                        <g clipPath="url(#clip0_637_8884)" id="Logo">
                          <path d={svgPaths.p266a5d00} fill="var(--fill-0, #4256AB)" id="Vector" />
                          <path d={svgPaths.p1ed4e80} fill="var(--fill-0, #4152A1)" id="Vector_2" />
                          <path d={svgPaths.p21491cb0} fill="var(--fill-0, #4256AB)" id="Vector_3" />
                          <path d={svgPaths.p13502d00} fill="var(--fill-0, #EE4B75)" id="Vector_4" />
                        </g>
                        <defs>
                          <clipPath id="clip0_637_8884">
                            <rect fill="white" height="55" width="120" />
                          </clipPath>
                        </defs>
                      </svg>
                    </div>
                  </div>
                  <div className="h-[45.5px] relative shrink-0 w-full" data-name="Paragraph">
                    <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[22.75px] left-0 not-italic text-[#62748e] text-[14px] top-px tracking-[-0.1504px] w-[396px]">The AI‑Native Integration Intelligence OS that connects truth, context, and outcomes across your business.</p>
                  </div>
                  <div className="content-stretch flex gap-[14px] h-[35px] items-start relative shrink-0 w-full" data-name="Container">
                    <Link>
                      <Wrapper additionalClassNames="relative shrink-0">
                        <path d={svgPaths.p2175bc00} id="Vector" stroke="var(--stroke-0, #90A1B9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.45833" />
                      </Wrapper>
                    </Link>
                    <Link>
                      <Wrapper additionalClassNames="relative shrink-0">
                        <path d={svgPaths.p85afc00} id="Vector" stroke="var(--stroke-0, #90A1B9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.45833" />
                        <path d={svgPaths.p256a2980} id="Vector_2" stroke="var(--stroke-0, #90A1B9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.45833" />
                        <path d={svgPaths.p1c8f680} id="Vector_3" stroke="var(--stroke-0, #90A1B9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.45833" />
                      </Wrapper>
                    </Link>
                    <Link>
                      <Wrapper additionalClassNames="relative shrink-0">
                        <path d={svgPaths.p2592b080} id="Vector" stroke="var(--stroke-0, #90A1B9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.45833" />
                        <path d={svgPaths.p1ddc42c0} id="Vector_2" stroke="var(--stroke-0, #90A1B9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.45833" />
                      </Wrapper>
                    </Link>
                  </div>
                </div>
                <div className="absolute content-stretch flex flex-col gap-[21px] h-[177.5px] items-start left-[481.5px] top-0 w-[439.5px]" data-name="Container">
                  <HeadingText1 text="Product" />
                  <div className="content-stretch flex flex-col gap-[14px] h-[126px] items-start relative shrink-0 w-full" data-name="List">
                    <Text text="Platform Overview" />
                    <Text text="Technical Architecture" />
                    <Text text="MCP Support" />
                    <Text text="Pricing" />
                  </div>
                </div>
                <div className="absolute content-stretch flex flex-col gap-[21px] h-[168px] items-start left-0 top-[219.5px] w-[439.5px]" data-name="Container">
                  <HeadingText1 text="Company" />
                  <div className="content-stretch flex flex-col gap-[14px] h-[126px] items-start relative shrink-0 w-full" data-name="List">
                    <Text text="About Us" />
                    <Text text="Careers" />
                    <Text text="Press Kit" />
                    <Text text="Privacy Policy" />
                  </div>
                </div>
                <div className="absolute content-stretch flex flex-col gap-[21px] h-[168px] items-start left-[481.5px] top-[219.5px] w-[439.5px]" data-name="Container">
                  <HeadingText1 text="Contact" />
                  <div className="content-stretch flex flex-col gap-[14px] h-[91px] items-start relative shrink-0 w-full" data-name="List">
                    <div className="content-stretch flex gap-[10.5px] h-[21px] items-center relative shrink-0 w-full" data-name="List Item">
                      <Wrapper additionalClassNames="relative shrink-0">
                        <path d={svgPaths.p3c89df0} id="Vector" stroke="var(--stroke-0, #EE4B75)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.45833" />
                        <path d={svgPaths.p2f9e0580} id="Vector_2" stroke="var(--stroke-0, #EE4B75)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.45833" />
                      </Wrapper>
                      <div className="h-[21px] relative shrink-0 w-[166.891px]" data-name="Link">
                        <Text1 text="connect@integratewise.ai" />
                      </div>
                    </div>
                    <div className="content-stretch flex gap-[10.5px] h-[21px] items-center relative shrink-0 w-full" data-name="List Item">
                      <Wrapper additionalClassNames="relative shrink-0">
                        <path d={svgPaths.p38986400} id="Vector" stroke="var(--stroke-0, #EE4B75)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.45833" />
                      </Wrapper>
                      <div className="h-[21px] relative shrink-0 w-[116.758px]" data-name="Link">
                        <Text1 text="+ 91 - 7026317111" />
                      </div>
                    </div>
                    <div className="content-stretch flex gap-[10.5px] h-[21px] items-center relative shrink-0 w-full" data-name="List Item">
                      <Wrapper additionalClassNames="relative shrink-0">
                        <path d={svgPaths.p3865fb00} id="Vector" stroke="var(--stroke-0, #EE4B75)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.45833" />
                        <path d={svgPaths.p2846f780} id="Vector_2" stroke="var(--stroke-0, #EE4B75)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.45833" />
                      </Wrapper>
                      <div className="h-[21px] relative shrink-0 w-[215.555px]" data-name="Text">
                        <Text1 text="San Francisco, CA / Bangalore, IN" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex h-[46.5px] items-center justify-between pt-px relative shrink-0 w-full" data-name="Container">
                <div aria-hidden="true" className="absolute border-[#f1f5f9] border-solid border-t inset-0 pointer-events-none" />
                <Text2 text="© 2026 IntegrateWise AI. All rights reserved." additionalClassNames="shrink-0 w-[263.945px]" />
                <div className="h-[17.5px] relative shrink-0 w-[273.234px]" data-name="Container">
                  <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[28px] items-start relative size-full">
                    <Text2 text="www.integratewise.ai" additionalClassNames="flex-[1_0_0] min-h-px min-w-px" />
                    <Text2 text="app.integratewise.ai" additionalClassNames="shrink-0 w-[119.391px]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bg-[rgba(255,255,255,0.8)] content-stretch flex flex-col h-[71px] items-start left-0 pb-px px-[21px] top-0 w-[963px]" data-name="Navbar">
        <div aria-hidden="true" className="absolute border-[#f1f5f9] border-b border-solid inset-0 pointer-events-none" />
        <div className="content-stretch flex h-[70px] items-center justify-between relative shrink-0 w-full" data-name="Container">
          <div className="h-[28px] relative shrink-0 w-[177.367px]" data-name="Container">
            <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[10.5px] items-center relative size-full">
              <div className="h-[17px] relative shrink-0 w-[36px]" data-name="Logo">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 36 17">
                  <g clipPath="url(#clip0_637_8976)" id="Logo">
                    <path d={svgPaths.p2a321200} fill="var(--fill-0, #4256AB)" id="Vector" />
                    <path d={svgPaths.p89b7f00} fill="var(--fill-0, #4152A1)" id="Vector_2" />
                    <path d={svgPaths.p3e2c2900} fill="var(--fill-0, #4256AB)" id="Vector_3" />
                    <path d={svgPaths.p1672ab80} fill="var(--fill-0, #EE4B75)" id="Vector_4" />
                  </g>
                  <defs>
                    <clipPath id="clip0_637_8976">
                      <rect fill="white" height="17" width="36" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <div className="flex-[1_0_0] h-[28px] min-h-px min-w-px relative" data-name="Text">
                <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
                  <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[0] left-0 not-italic text-[#1e2a4a] text-[21px] top-[-0.5px] tracking-[-0.8839px] whitespace-nowrap">
                    <span className="leading-[28px]">Integrate</span>
                    <span className="leading-[28px] text-[#f54476]">Wise</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="h-[38.5px] relative shrink-0 w-[486.852px]" data-name="Container">
            <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[28px] items-center relative size-full">
              <Wrapper1 additionalClassNames="w-[58.141px]">
                <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[21px] left-[29.5px] not-italic text-[#45556c] text-[14px] text-center top-0 tracking-[-0.1504px] whitespace-nowrap">The Why</p>
              </Wrapper1>
              <Wrapper1 additionalClassNames="w-[79.789px]">
                <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[21px] left-[40px] not-italic text-[#45556c] text-[14px] text-center top-0 tracking-[-0.1504px] whitespace-nowrap">{`Who It's For`}</p>
              </Wrapper1>
              <Wrapper1 additionalClassNames="w-[82.008px]">
                <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[21px] left-[41px] not-italic text-[#45556c] text-[14px] text-center top-0 tracking-[-0.1504px] whitespace-nowrap">Architecture</p>
              </Wrapper1>
              <Wrapper1 additionalClassNames="w-[45.938px]">
                <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[21px] left-[23px] not-italic text-[#4256ab] text-[14px] text-center top-0 tracking-[-0.1504px] whitespace-nowrap">Pricing</p>
              </Wrapper1>
              <div className="bg-[#4256ab] flex-[1_0_0] h-[38.5px] min-h-px min-w-px relative rounded-[16777200px]" data-name="Button">
                <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
                  <p className="-translate-x-1/2 absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[21px] left-[54.5px] not-italic text-[14px] text-center text-white top-[8.75px] tracking-[-0.1504px] whitespace-nowrap">Go to App</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}