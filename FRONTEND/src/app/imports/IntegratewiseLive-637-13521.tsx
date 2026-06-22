import clsx from "clsx";
import svgPaths from "./svg-tbod7fg0hh";

function LinkBackgroundImage({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="bg-[#f8fafc] relative rounded-[16777200px] shrink-0 size-[35px]">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center px-[8.75px] relative size-full">{children}</div>
    </div>
  );
}

function ContainerBackgroundImage3({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="h-[77px] relative rounded-[11px] shrink-0 w-full">
      <div className="content-stretch flex gap-[14px] items-start pl-[14px] pt-[14px] relative size-full">{children}</div>
    </div>
  );
}
type ContainerBackgroundImage2Props = {
  additionalClassNames?: string;
};

function ContainerBackgroundImage2({ children, additionalClassNames = "" }: React.PropsWithChildren<ContainerBackgroundImage2Props>) {
  return (
    <div className={clsx("h-[49px] relative shrink-0", additionalClassNames)}>
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[3.5px] items-start relative size-full">{children}</div>
    </div>
  );
}

function ContainerBackgroundImage1({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="h-[49px] relative shrink-0 w-[28px]">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">{children}</div>
    </div>
  );
}

function BackgroundImage5({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="h-[24.5px] relative shrink-0 w-full">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[24.5px] left-0 not-italic text-[#1d293d] text-[15.75px] top-0 tracking-[-0.2922px] whitespace-nowrap">{children}</p>
    </div>
  );
}

function BackgroundImage4({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="h-[21px] relative shrink-0 w-full">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-0 not-italic text-[#62748e] text-[14px] top-0 tracking-[-0.1504px] whitespace-nowrap">{children}</p>
    </div>
  );
}
type BackgroundImage3Props = {
  additionalClassNames?: string;
};

function BackgroundImage3({ children, additionalClassNames = "" }: React.PropsWithChildren<BackgroundImage3Props>) {
  return (
    <div className={additionalClassNames}>
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">{children}</div>
    </div>
  );
}
type BackgroundImage2Props = {
  additionalClassNames?: string;
};

function BackgroundImage2({ children, additionalClassNames = "" }: React.PropsWithChildren<BackgroundImage2Props>) {
  return <BackgroundImage3 additionalClassNames={clsx("flex-[1_0_0] min-h-px min-w-px relative", additionalClassNames)}>{children}</BackgroundImage3>;
}
type BackgroundImage1Props = {
  additionalClassNames?: string;
};

function BackgroundImage1({ children, additionalClassNames = "" }: React.PropsWithChildren<BackgroundImage1Props>) {
  return <BackgroundImage3 additionalClassNames={clsx("h-[14px] relative shrink-0", additionalClassNames)}>{children}</BackgroundImage3>;
}
type BackgroundImageProps = {
  additionalClassNames?: string;
};

function BackgroundImage({ children, additionalClassNames = "" }: React.PropsWithChildren<BackgroundImageProps>) {
  return <BackgroundImage3 additionalClassNames={clsx("h-[21px] relative shrink-0", additionalClassNames)}>{children}</BackgroundImage3>;
}

function IconBackgroundImage({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0 size-[17.5px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.5 17.5">
        <g id="Icon">{children}</g>
      </svg>
    </div>
  );
}

function ContainerBackgroundImage({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="bg-[#f8fafc] h-[44px] relative rounded-[7px] shrink-0 w-full">
      <div aria-hidden="true" className="absolute border border-[#f1f5f9] border-solid inset-0 pointer-events-none rounded-[7px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between px-[11.5px] py-px relative size-full">{children}</div>
      </div>
    </div>
  );
}
type Icon1VectorBackgroundImage1Props = {
  additionalClassNames?: string;
};

function Icon1VectorBackgroundImage1({ children, additionalClassNames = "" }: React.PropsWithChildren<Icon1VectorBackgroundImage1Props>) {
  return (
    <div className={clsx("absolute", additionalClassNames)}>
      <div className="absolute inset-[-1.17px_-6.25%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21 2.33333">
          {children}
        </svg>
      </div>
    </div>
  );
}
type Icon1VectorBackgroundImageProps = {
  additionalClassNames?: string;
};

function Icon1VectorBackgroundImage({ children, additionalClassNames = "" }: React.PropsWithChildren<Icon1VectorBackgroundImageProps>) {
  return (
    <div className={clsx("absolute", additionalClassNames)}>
      <div className="absolute inset-[-12.5%_-25%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7 11.6667">
          {children}
        </svg>
      </div>
    </div>
  );
}
type BackgroundImageAndText2Props = {
  text: string;
  additionalClassNames?: string;
};

function BackgroundImageAndText2({ text, additionalClassNames = "" }: BackgroundImageAndText2Props) {
  return (
    <BackgroundImage3 additionalClassNames={clsx("h-[17.5px] relative", additionalClassNames)}>
      <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[17.5px] left-0 not-italic text-[#90a1b9] text-[12.25px] top-[0.5px] tracking-[-0.0179px] whitespace-nowrap">{text}</p>
    </BackgroundImage3>
  );
}
type HeadingBackgroundImageAndText1Props = {
  text: string;
};

function HeadingBackgroundImageAndText1({ text }: HeadingBackgroundImageAndText1Props) {
  return (
    <div className="h-[21px] relative shrink-0 w-full">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[21px] left-0 not-italic text-[#0f172b] text-[14px] top-0 tracking-[-0.1504px] whitespace-nowrap">{text}</p>
    </div>
  );
}
type Icon2VectorBackgroundImageProps = {
  additionalClassNames?: string;
};

function Icon2VectorBackgroundImage({ additionalClassNames = "" }: Icon2VectorBackgroundImageProps) {
  return (
    <div className={clsx("absolute", additionalClassNames)}>
      <div className="absolute inset-[-100%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3.5 3.5">
          <path d={svgPaths.p3135d100} id="Vector" stroke="var(--stroke-0, #EE4B75)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
        </svg>
      </div>
    </div>
  );
}
type BackgroundImageAndText1Props = {
  text: string;
};

function BackgroundImageAndText1({ text }: BackgroundImageAndText1Props) {
  return (
    <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-0 not-italic text-[#62748e] text-[14px] top-0 tracking-[-0.1504px] whitespace-nowrap">{text}</p>
    </div>
  );
}
type BackgroundImageAndTextProps = {
  text: string;
};

function BackgroundImageAndText({ text }: BackgroundImageAndTextProps) {
  return <BackgroundImage4>{text}</BackgroundImage4>;
}
type HeadingBackgroundImageAndTextProps = {
  text: string;
};

function HeadingBackgroundImageAndText({ text }: HeadingBackgroundImageAndTextProps) {
  return <BackgroundImage5>{text}</BackgroundImage5>;
}

export default function IntegratewiseLive() {
  return (
    <div className="bg-[#f5f6fa] relative size-full" data-name="Integratewise-live">
      <div className="absolute bg-white content-stretch flex flex-col h-[2021.875px] items-start left-0 top-0 w-[963px]" data-name="App">
        <div className="bg-white content-stretch flex flex-col h-[1425.875px] items-start pt-[70px] relative shrink-0 w-full" data-name="ProblemPage">
          <div className="bg-[#f3f4f6] h-[1075.875px] relative shrink-0 w-full" data-name="Problem">
            <div className="absolute h-[448.875px] left-[21px] top-[84px] w-[921px]" data-name="Container">
              <div className="absolute font-['Inter:Extra_Bold',sans-serif] font-extrabold h-[70px] leading-[35px] left-0 not-italic text-[31.5px] top-0 tracking-[0.4037px] w-[921px] whitespace-nowrap" data-name="Heading 2">
                <p className="absolute left-0 text-[#1e2a4a] top-0">{`Your tools are connected. `}</p>
                <p className="absolute left-0 text-[#f54476] top-[35px]">{`Your intelligence isn't.`}</p>
              </div>
              <div className="absolute h-[56.875px] left-0 top-[91px] w-[921px]" data-name="Paragraph">
                <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[28.438px] left-0 not-italic text-[#45556c] text-[17.5px] top-[-0.5px] tracking-[-0.4358px] w-[901px]">Modern B2B SaaS teams need something different: an operating system that understands their business, preserves their workflows, and makes every tool smarter over time.</p>
              </div>
              <div className="absolute content-stretch flex flex-col gap-[21px] h-[273px] items-start left-0 top-[175.88px] w-[921px]" data-name="Container">
                <ContainerBackgroundImage3>
                  <ContainerBackgroundImage1>
                    <div className="h-[28px] overflow-clip relative shrink-0 w-full" data-name="Icon">
                      <div className="absolute inset-[8.33%]" data-name="Vector">
                        <div className="absolute inset-[-5%]">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25.6667 25.6667">
                            <path d={svgPaths.p85c8080} id="Vector" stroke="var(--stroke-0, #EE4B75)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute bottom-1/2 left-1/2 right-1/2 top-[33.33%]" data-name="Vector">
                        <div className="absolute inset-[-25%_-1.17px]">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2.33333 7">
                            <path d="M1.16667 1.16667V5.83333" id="Vector" stroke="var(--stroke-0, #EE4B75)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute bottom-[33.33%] left-1/2 right-[49.96%] top-[66.67%]" data-name="Vector">
                        <div className="absolute inset-[-1.17px_-9999.77%]">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2.345 2.33333">
                            <path d="M1.16667 1.16667H1.17833" id="Vector" stroke="var(--stroke-0, #EE4B75)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </ContainerBackgroundImage1>
                  <ContainerBackgroundImage2 additionalClassNames="w-[698.906px]">
                    <HeadingBackgroundImageAndText text="CRMs are static databases" />
                    <BackgroundImage4>{`They show what happened in the past, not what's really going on with your customer relationships right now.`}</BackgroundImage4>
                  </ContainerBackgroundImage2>
                </ContainerBackgroundImage3>
                <ContainerBackgroundImage3>
                  <ContainerBackgroundImage1>
                    <div className="h-[28px] overflow-clip relative shrink-0 w-full" data-name="Icon">
                      <Icon1VectorBackgroundImage additionalClassNames="inset-[12.5%_16.67%_54.17%_66.67%]">
                        <path d={svgPaths.p3135f500} id="Vector" stroke="var(--stroke-0, #EE4B75)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
                      </Icon1VectorBackgroundImage>
                      <Icon1VectorBackgroundImage1 additionalClassNames="inset-[29.17%_16.67%_70.83%_16.67%]">
                        <path d="M19.8333 1.16667H1.16667" id="Vector" stroke="var(--stroke-0, #EE4B75)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
                      </Icon1VectorBackgroundImage1>
                      <Icon1VectorBackgroundImage additionalClassNames="inset-[54.17%_66.67%_12.5%_16.67%]">
                        <path d={svgPaths.p218e7780} id="Vector" stroke="var(--stroke-0, #EE4B75)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
                      </Icon1VectorBackgroundImage>
                      <Icon1VectorBackgroundImage1 additionalClassNames="inset-[70.83%_16.67%_29.17%_16.67%]">
                        <path d="M1.16667 1.16667H19.8333" id="Vector" stroke="var(--stroke-0, #EE4B75)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
                      </Icon1VectorBackgroundImage1>
                    </div>
                  </ContainerBackgroundImage1>
                  <ContainerBackgroundImage2 additionalClassNames="w-[635.016px]">
                    <HeadingBackgroundImageAndText text="Automation is rigid" />
                    <BackgroundImageAndText text="Traditional tools just move data A→B. They break the moment business reality or schemas change." />
                  </ContainerBackgroundImage2>
                </ContainerBackgroundImage3>
                <ContainerBackgroundImage3>
                  <ContainerBackgroundImage1>
                    <div className="h-[28px] overflow-clip relative shrink-0 w-full" data-name="Icon">
                      <div className="absolute bottom-[8.35%] left-[8.33%] right-1/2 top-[8.3%]" data-name="Vector">
                        <div className="absolute inset-[-5%_-10%]">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.001 25.672">
                            <path d={svgPaths.p108dea00} id="Vector" stroke="var(--stroke-0, #EE4B75)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute bottom-[45.83%] left-[37.5%] right-1/2 top-[37.5%]" data-name="Vector">
                        <div className="absolute inset-[-25%_-33.33%_-25.01%_-33.34%]">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5.83368 7.00035">
                            <path d={svgPaths.p39146cc0} id="Vector" stroke="var(--stroke-0, #EE4B75)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute inset-[21.35%_73.33%_72.92%_25.01%]" data-name="Vector">
                        <div className="absolute inset-[-72.73%_-251.3%_-72.74%_-251.26%]">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2.79788 3.93771">
                            <path d={svgPaths.p9ac8600} id="Vector" stroke="var(--stroke-0, #EE4B75)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute inset-[43.75%_83.07%_54.6%_14.49%]" data-name="Vector">
                        <div className="absolute inset-[-252.57%_-170.97%_-252.53%_-170.95%]">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3.01608 2.79558">
                            <path d={svgPaths.p30e86100} id="Vector" stroke="var(--stroke-0, #EE4B75)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute bottom-1/4 left-[16.8%] right-3/4 top-[72.85%]" data-name="Vector">
                        <div className="absolute inset-[-193.83%_-50.84%_-193.8%_-50.85%]">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 4.62837 2.93554">
                            <path d={svgPaths.p16080380} id="Vector" stroke="var(--stroke-0, #EE4B75)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute bottom-[45.83%] left-1/2 right-[33.33%] top-[54.17%]" data-name="Vector">
                        <div className="absolute inset-[-1.17px_-25%]">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7 2.33333">
                            <path d="M1.16667 1.16667H5.83333" id="Vector" stroke="var(--stroke-0, #EE4B75)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute bottom-[12.5%] left-1/2 right-[16.67%] top-3/4" data-name="Vector">
                        <div className="absolute inset-[-33.33%_-12.5%]">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11.6667 5.83333">
                            <path d={svgPaths.p2cde7c80} id="Vector" stroke="var(--stroke-0, #EE4B75)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute bottom-[66.67%] left-1/2 right-[16.67%] top-[33.33%]" data-name="Vector">
                        <div className="absolute inset-[-1.17px_-12.5%]">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11.6667 2.33333">
                            <path d="M1.16667 1.16667H10.5" id="Vector" stroke="var(--stroke-0, #EE4B75)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute bottom-[66.67%] left-[66.67%] right-1/4 top-[12.5%]" data-name="Vector">
                        <div className="absolute inset-[-20%_-50%]">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 4.66667 8.16667">
                            <path d={svgPaths.p38f04980} id="Vector" stroke="var(--stroke-0, #EE4B75)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
                          </svg>
                        </div>
                      </div>
                      <Icon2VectorBackgroundImage additionalClassNames="inset-[52.08%_31.25%_43.75%_64.58%]" />
                      <Icon2VectorBackgroundImage additionalClassNames="inset-[10.42%_22.92%_85.42%_72.92%]" />
                      <Icon2VectorBackgroundImage additionalClassNames="inset-[85.42%_14.58%_10.42%_81.25%]" />
                      <Icon2VectorBackgroundImage additionalClassNames="inset-[31.25%_14.58%_64.58%_81.25%]" />
                    </div>
                  </ContainerBackgroundImage1>
                  <ContainerBackgroundImage2 additionalClassNames="w-[656.227px]">
                    <BackgroundImage5>{`AI replaces, it doesn't enhance`}</BackgroundImage5>
                    <BackgroundImageAndText text="New AI apps try to replace your team instead of augmenting them, leading to loss of control and trust." />
                  </ContainerBackgroundImage2>
                </ContainerBackgroundImage3>
              </div>
            </div>
            <div className="absolute h-[424px] left-[333.4px] top-[567.88px] w-[296.203px]" data-name="Container">
              <div className="absolute flex h-[438.91px] items-center justify-center left-[-10.79px] top-[-7.46px] w-[317.785px]" style={{ "--transform-inner-width": "1185", "--transform-inner-height": "0" } as React.CSSProperties}>
                <div className="flex-none rotate-3">
                  <div className="h-[424px] rounded-[21px] w-[296px]" data-name="Container" style={{ backgroundImage: "linear-gradient(124.919deg, rgba(66, 86, 171, 0.2) 0%, rgba(238, 75, 117, 0.2) 100%)" }} />
                </div>
              </div>
              <div className="absolute bg-white border border-[#e2e8f0] border-solid h-[424px] left-0 rounded-[21px] shadow-[0px_20px_25px_0px_rgba(0,0,0,0.1),0px_8px_10px_0px_rgba(0,0,0,0.1)] top-0 w-[296.203px]" data-name="Container">
                <div className="absolute content-stretch flex flex-col gap-[14px] h-[218px] items-start left-[28px] top-[28px] w-[238.203px]" data-name="Container">
                  <ContainerBackgroundImage>
                    <BackgroundImage1 additionalClassNames="w-[57.008px]">
                      <p className="-translate-x-1/2 absolute font-['Inter:Bold',sans-serif] font-bold leading-[14px] left-[29px] not-italic text-[#62748e] text-[10.5px] text-center top-0 tracking-[0.0923px] whitespace-nowrap">Salesforce</p>
                    </BackgroundImage1>
                    <BackgroundImage additionalClassNames="bg-[#dbeafe] rounded-[16777200px] w-[147.695px]">
                      <p className="-translate-x-1/2 absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[14px] left-[74px] not-italic text-[#1447e6] text-[10.5px] text-center top-[3.5px] tracking-[0.0923px] whitespace-nowrap">{`Deal marked 'Committed'`}</p>
                    </BackgroundImage>
                  </ContainerBackgroundImage>
                  <ContainerBackgroundImage>
                    <BackgroundImage1 additionalClassNames="w-[45.93px]">
                      <p className="-translate-x-1/2 absolute font-['Inter:Bold',sans-serif] font-bold leading-[14px] left-[23px] not-italic text-[#62748e] text-[10.5px] text-center top-0 tracking-[0.0923px] whitespace-nowrap">Zendesk</p>
                    </BackgroundImage1>
                    <BackgroundImage additionalClassNames="bg-[#fef3c6] rounded-[16777200px] w-[103.664px]">
                      <p className="-translate-x-1/2 absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[14px] left-[52px] not-italic text-[#bb4d00] text-[10.5px] text-center top-[3.5px] tracking-[0.0923px] whitespace-nowrap">3 P1 tickets open</p>
                    </BackgroundImage>
                  </ContainerBackgroundImage>
                  <ContainerBackgroundImage>
                    <BackgroundImage1 additionalClassNames="w-[29.328px]">
                      <p className="-translate-x-1/2 absolute font-['Inter:Bold',sans-serif] font-bold leading-[14px] left-[15.5px] not-italic text-[#62748e] text-[10.5px] text-center top-0 tracking-[0.0923px] whitespace-nowrap">Slack</p>
                    </BackgroundImage1>
                    <BackgroundImage additionalClassNames="bg-[#ffe2e2] rounded-[16777200px] w-[127.25px]">
                      <p className="-translate-x-1/2 absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[14px] left-[64px] not-italic text-[#c10007] text-[10.5px] text-center top-[3.5px] tracking-[0.0923px] whitespace-nowrap">Champion went silent</p>
                    </BackgroundImage>
                  </ContainerBackgroundImage>
                  <ContainerBackgroundImage>
                    <BackgroundImage1 additionalClassNames="w-[32.664px]">
                      <p className="-translate-x-1/2 absolute font-['Inter:Bold',sans-serif] font-bold leading-[14px] left-[16px] not-italic text-[#62748e] text-[10.5px] text-center top-0 tracking-[0.0923px] whitespace-nowrap">Stripe</p>
                    </BackgroundImage1>
                    <BackgroundImage additionalClassNames="bg-[#ffe4e6] rounded-[16777200px] w-[123.195px]">
                      <p className="-translate-x-1/2 absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[14px] left-[62px] not-italic text-[#c70036] text-[10.5px] text-center top-[3.5px] tracking-[0.0923px] whitespace-nowrap">Payment failed twice</p>
                    </BackgroundImage>
                  </ContainerBackgroundImage>
                </div>
                <div className="absolute bg-[#e2e8f0] h-px left-[126.1px] top-[274px] w-[42px]" data-name="Container" />
                <div className="absolute bg-[#f1f5f9] content-stretch flex items-center justify-center left-[119.1px] px-[14px] rounded-[14px] size-[56px] top-[289px]" data-name="Container">
                  <div className="relative shrink-0 size-[28px]" data-name="Icon">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28 28">
                      <g id="Icon">
                        <path d={svgPaths.p1b228440} id="Vector" stroke="var(--stroke-0, #90A1B9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
                        <path d="M14 9.33333V14" id="Vector_2" stroke="var(--stroke-0, #90A1B9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
                        <path d="M14 18.6667H14.0117" id="Vector_3" stroke="var(--stroke-0, #90A1B9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
                      </g>
                    </svg>
                  </div>
                </div>
                <div className="absolute h-[17.5px] left-[62.67px] top-[359px] w-[168.859px]" data-name="Paragraph">
                  <p className="-translate-x-1/2 absolute font-['Inter:Bold',sans-serif] font-bold leading-[17.5px] left-[84.5px] not-italic text-[#1d293d] text-[12.25px] text-center top-[0.5px] tracking-[-0.0179px] whitespace-nowrap">No one connected the dots.</p>
                </div>
                <div className="absolute h-[14px] left-[57.08px] top-[380px] w-[180.047px]" data-name="Paragraph">
                  <p className="-translate-x-1/2 absolute font-['Inter:Regular',sans-serif] font-normal leading-[14px] left-[90.5px] not-italic text-[#90a1b9] text-[10.5px] text-center top-0 tracking-[0.0923px] whitespace-nowrap">This account churned 47 days later.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white h-[280px] relative shrink-0 w-full" data-name="Container">
            <div className="content-stretch flex flex-col gap-[21px] items-start pt-[70px] px-[103.5px] relative size-full">
              <div className="h-[28px] relative shrink-0 w-full" data-name="Heading 3">
                <p className="-translate-x-1/2 absolute font-['Inter:Bold',sans-serif] font-bold leading-[28px] left-[377.81px] not-italic text-[#4152a1] text-[21px] text-center top-[-0.5px] tracking-[-0.3589px] whitespace-nowrap">{`The high cost of "Good Enough" integrations`}</p>
              </div>
              <div className="h-[63px] relative shrink-0 w-full" data-name="Paragraph">
                <p className="-translate-x-1/2 absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-[378.24px] not-italic text-[#45556c] text-[14px] text-center top-0 tracking-[-0.1504px] w-[738px]">Most companies lose 15-20% of their potential NRR simply because their data is siloed and context-less. IntegrateWise solves this by creating a unified cognitive layer that understands the relationship between your tools and your goals.</p>
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
                    <LinkBackgroundImage>
                      <IconBackgroundImage>
                        <path d={svgPaths.p2175bc00} id="Vector" stroke="var(--stroke-0, #90A1B9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.45833" />
                      </IconBackgroundImage>
                    </LinkBackgroundImage>
                    <LinkBackgroundImage>
                      <IconBackgroundImage>
                        <path d={svgPaths.p85afc00} id="Vector" stroke="var(--stroke-0, #90A1B9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.45833" />
                        <path d={svgPaths.p256a2980} id="Vector_2" stroke="var(--stroke-0, #90A1B9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.45833" />
                        <path d={svgPaths.p1c8f680} id="Vector_3" stroke="var(--stroke-0, #90A1B9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.45833" />
                      </IconBackgroundImage>
                    </LinkBackgroundImage>
                    <LinkBackgroundImage>
                      <IconBackgroundImage>
                        <path d={svgPaths.p2592b080} id="Vector" stroke="var(--stroke-0, #90A1B9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.45833" />
                        <path d={svgPaths.p1ddc42c0} id="Vector_2" stroke="var(--stroke-0, #90A1B9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.45833" />
                      </IconBackgroundImage>
                    </LinkBackgroundImage>
                  </div>
                </div>
                <div className="absolute content-stretch flex flex-col gap-[21px] h-[177.5px] items-start left-[481.5px] top-0 w-[439.5px]" data-name="Container">
                  <HeadingBackgroundImageAndText1 text="Product" />
                  <div className="content-stretch flex flex-col gap-[14px] h-[126px] items-start relative shrink-0 w-full" data-name="List">
                    <BackgroundImageAndText text="Platform Overview" />
                    <BackgroundImageAndText text="Technical Architecture" />
                    <BackgroundImageAndText text="MCP Support" />
                    <BackgroundImageAndText text="Pricing" />
                  </div>
                </div>
                <div className="absolute content-stretch flex flex-col gap-[21px] h-[168px] items-start left-0 top-[219.5px] w-[439.5px]" data-name="Container">
                  <HeadingBackgroundImageAndText1 text="Company" />
                  <div className="content-stretch flex flex-col gap-[14px] h-[126px] items-start relative shrink-0 w-full" data-name="List">
                    <BackgroundImageAndText text="About Us" />
                    <BackgroundImageAndText text="Careers" />
                    <BackgroundImageAndText text="Press Kit" />
                    <BackgroundImageAndText text="Privacy Policy" />
                  </div>
                </div>
                <div className="absolute content-stretch flex flex-col gap-[21px] h-[168px] items-start left-[481.5px] top-[219.5px] w-[439.5px]" data-name="Container">
                  <HeadingBackgroundImageAndText1 text="Contact" />
                  <div className="content-stretch flex flex-col gap-[14px] h-[91px] items-start relative shrink-0 w-full" data-name="List">
                    <div className="content-stretch flex gap-[10.5px] h-[21px] items-center relative shrink-0 w-full" data-name="List Item">
                      <IconBackgroundImage>
                        <path d={svgPaths.p3c89df0} id="Vector" stroke="var(--stroke-0, #EE4B75)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.45833" />
                        <path d={svgPaths.p2f9e0580} id="Vector_2" stroke="var(--stroke-0, #EE4B75)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.45833" />
                      </IconBackgroundImage>
                      <div className="h-[21px] relative shrink-0 w-[166.891px]" data-name="Link">
                        <BackgroundImageAndText1 text="connect@integratewise.ai" />
                      </div>
                    </div>
                    <div className="content-stretch flex gap-[10.5px] h-[21px] items-center relative shrink-0 w-full" data-name="List Item">
                      <IconBackgroundImage>
                        <path d={svgPaths.p38986400} id="Vector" stroke="var(--stroke-0, #EE4B75)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.45833" />
                      </IconBackgroundImage>
                      <div className="h-[21px] relative shrink-0 w-[116.758px]" data-name="Link">
                        <BackgroundImageAndText1 text="+ 91 - 7026317111" />
                      </div>
                    </div>
                    <div className="content-stretch flex gap-[10.5px] h-[21px] items-center relative shrink-0 w-full" data-name="List Item">
                      <IconBackgroundImage>
                        <path d={svgPaths.p3865fb00} id="Vector" stroke="var(--stroke-0, #EE4B75)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.45833" />
                        <path d={svgPaths.p2846f780} id="Vector_2" stroke="var(--stroke-0, #EE4B75)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.45833" />
                      </IconBackgroundImage>
                      <div className="h-[21px] relative shrink-0 w-[215.555px]" data-name="Text">
                        <BackgroundImageAndText1 text="San Francisco, CA / Bangalore, IN" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex h-[46.5px] items-center justify-between pt-px relative shrink-0 w-full" data-name="Container">
                <div aria-hidden="true" className="absolute border-[#f1f5f9] border-solid border-t inset-0 pointer-events-none" />
                <BackgroundImageAndText2 text="© 2026 IntegrateWise AI. All rights reserved." additionalClassNames="shrink-0 w-[263.945px]" />
                <div className="h-[17.5px] relative shrink-0 w-[273.234px]" data-name="Container">
                  <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[28px] items-start relative size-full">
                    <BackgroundImageAndText2 text="www.integratewise.ai" additionalClassNames="flex-[1_0_0] min-h-px min-w-px" />
                    <BackgroundImageAndText2 text="app.integratewise.ai" additionalClassNames="shrink-0 w-[119.391px]" />
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
              <BackgroundImage2 additionalClassNames="h-[28px]">
                <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[0] left-0 not-italic text-[#1e2a4a] text-[21px] top-[-0.5px] tracking-[-0.8839px] whitespace-nowrap">
                  <span className="leading-[28px]">Integrate</span>
                  <span className="leading-[28px] text-[#f54476]">Wise</span>
                </p>
              </BackgroundImage2>
            </div>
          </div>
          <div className="h-[38.5px] relative shrink-0 w-[486.852px]" data-name="Container">
            <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[28px] items-center relative size-full">
              <BackgroundImage additionalClassNames="w-[58.141px]">
                <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[21px] left-[29.5px] not-italic text-[#4256ab] text-[14px] text-center top-0 tracking-[-0.1504px] whitespace-nowrap">The Why</p>
              </BackgroundImage>
              <BackgroundImage additionalClassNames="w-[79.789px]">
                <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[21px] left-[40px] not-italic text-[#45556c] text-[14px] text-center top-0 tracking-[-0.1504px] whitespace-nowrap">{`Who It's For`}</p>
              </BackgroundImage>
              <BackgroundImage additionalClassNames="w-[82.008px]">
                <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[21px] left-[41px] not-italic text-[#45556c] text-[14px] text-center top-0 tracking-[-0.1504px] whitespace-nowrap">Architecture</p>
              </BackgroundImage>
              <BackgroundImage additionalClassNames="w-[45.938px]">
                <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[21px] left-[23px] not-italic text-[#45556c] text-[14px] text-center top-0 tracking-[-0.1504px] whitespace-nowrap">Pricing</p>
              </BackgroundImage>
              <BackgroundImage2 additionalClassNames="bg-[#4256ab] h-[38.5px] rounded-[16777200px]">
                <p className="-translate-x-1/2 absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[21px] left-[54.5px] not-italic text-[14px] text-center text-white top-[8.75px] tracking-[-0.1504px] whitespace-nowrap">Go to App</p>
              </BackgroundImage2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}