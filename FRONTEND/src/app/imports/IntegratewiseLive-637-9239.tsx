import clsx from "clsx";
import svgPaths from "./svg-txyu5gt9vo";
type WrapperProps = {
  additionalClassNames?: string;
};

function Wrapper({ children, additionalClassNames = "" }: React.PropsWithChildren<WrapperProps>) {
  return (
    <div className={clsx("relative shrink-0", additionalClassNames)}>
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">{children}</div>
    </div>
  );
}
type IconProps = {
  additionalClassNames?: string;
};

function Icon({ children, additionalClassNames = "" }: React.PropsWithChildren<IconProps>) {
  return (
    <div className={clsx("absolute size-[14px]", additionalClassNames)}>
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="Icon">{children}</g>
      </svg>
    </div>
  );
}
type TextProps = {
  text: string;
  additionalClassNames?: string;
};

function Text({ text, additionalClassNames = "" }: TextProps) {
  return (
    <div className={clsx("content-stretch flex items-center overflow-clip py-[8.75px] relative rounded-[inherit] size-full", additionalClassNames)}>
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[12.25px] text-[rgba(30,41,59,0.5)] tracking-[-0.0179px] whitespace-nowrap">{text}</p>
    </div>
  );
}
type LabelTextProps = {
  text: string;
};

function LabelText({ text }: LabelTextProps) {
  return (
    <div className="h-[14px] relative shrink-0 w-full">
      <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[14px] left-0 not-italic text-[#45556c] text-[10.5px] top-0 tracking-[0.0923px] whitespace-nowrap">{text}</p>
    </div>
  );
}

export default function IntegratewiseLive() {
  return (
    <div className="bg-[#f3f4f6] content-stretch flex items-start relative size-full" data-name="Integratewise-live">
      <div className="flex-[969_0_0] h-[660px] min-h-px min-w-px relative" data-name="Container">
        <div className="flex flex-row items-center justify-center size-full">
          <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center px-[316.5px] relative size-full">
            <Wrapper additionalClassNames="h-[476px] w-[336px]">
              <div className="absolute content-stretch flex gap-[7px] h-[24.5px] items-center left-0 top-0 w-[336px]" data-name="LoginPage">
                <div className="h-[15px] relative shrink-0 w-[32px]" data-name="Logo">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 15">
                    <g clipPath="url(#clip0_637_9245)" id="Logo">
                      <path d={svgPaths.p3da46780} fill="var(--fill-0, #4256AB)" id="Vector" />
                      <path d={svgPaths.p1e618c00} fill="var(--fill-0, #4152A1)" id="Vector_2" />
                      <path d={svgPaths.p561c9f0} fill="var(--fill-0, #4256AB)" id="Vector_3" />
                      <path d={svgPaths.p3e081280} fill="var(--fill-0, #EE4B75)" id="Vector_4" />
                    </g>
                    <defs>
                      <clipPath id="clip0_637_9245">
                        <rect fill="white" height="15" width="32" />
                      </clipPath>
                    </defs>
                  </svg>
                </div>
                <Wrapper additionalClassNames="h-[24.5px] w-[106.961px]">
                  <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[0] left-0 not-italic text-[#1e2a4a] text-[15.75px] top-0 tracking-[-0.2922px] whitespace-nowrap">
                    <span className="leading-[24.5px]">Integrate</span>
                    <span className="leading-[24.5px] text-[#f54476]">Wise</span>
                  </p>
                </Wrapper>
              </div>
              <div className="absolute content-stretch flex flex-col gap-[3.5px] h-[49px] items-start left-0 top-[52.5px] w-[336px]" data-name="LoginPage">
                <div className="h-[28px] relative shrink-0 w-full" data-name="Heading 1">
                  <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[28px] left-0 not-italic text-[#1e2a4a] text-[21px] top-[-0.5px] tracking-[-0.3589px] whitespace-nowrap">Welcome back</p>
                </div>
                <div className="h-[17.5px] relative shrink-0 w-full" data-name="Paragraph">
                  <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[17.5px] left-0 not-italic text-[#62748e] text-[12.25px] top-[0.5px] tracking-[-0.0179px] whitespace-nowrap">Sign in to your workspace</p>
                </div>
              </div>
              <div className="absolute content-stretch flex flex-col gap-[14px] h-[207px] items-start left-0 top-[129.5px] w-[336px]" data-name="LoginPage">
                <div className="content-stretch flex flex-col gap-[5.25px] h-[56.25px] items-start relative shrink-0 w-full" data-name="Container">
                  <LabelText text="Email" />
                  <div className="h-[37px] relative shrink-0 w-full" data-name="Container">
                    <div className="absolute bg-white h-[37px] left-0 rounded-[11px] top-0 w-[336px]" data-name="Email Input">
                      <Text text="you@company.com" additionalClassNames="pl-[35px] pr-[14px]" />
                      <div aria-hidden="true" className="absolute border border-[#e2e8f0] border-solid inset-0 pointer-events-none rounded-[11px]" />
                    </div>
                    <Icon additionalClassNames="left-[10.5px] top-[11.5px]">
                      <path d={svgPaths.p5c184f0} id="Vector" stroke="var(--stroke-0, #90A1B9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                      <path d={svgPaths.p2a640080} id="Vector_2" stroke="var(--stroke-0, #90A1B9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                    </Icon>
                  </div>
                </div>
                <div className="content-stretch flex flex-col gap-[5.25px] h-[56.25px] items-start relative shrink-0 w-full" data-name="Container">
                  <LabelText text="Password" />
                  <div className="h-[37px] relative shrink-0 w-full" data-name="Container">
                    <div className="absolute bg-white h-[37px] left-0 rounded-[11px] top-0 w-[336px]" data-name="Password Input">
                      <Text text="Enter your password" additionalClassNames="px-[35px]" />
                      <div aria-hidden="true" className="absolute border border-[#e2e8f0] border-solid inset-0 pointer-events-none rounded-[11px]" />
                    </div>
                    <Icon additionalClassNames="left-[10.5px] top-[11.5px]">
                      <path d={svgPaths.p1aca3780} id="Vector" stroke="var(--stroke-0, #90A1B9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                      <path d={svgPaths.p2b92b800} id="Vector_2" stroke="var(--stroke-0, #90A1B9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                    </Icon>
                    <div className="absolute content-stretch flex flex-col items-start left-[311.5px] size-[14px] top-[11.5px]" data-name="Button">
                      <div className="h-[14px] overflow-clip relative shrink-0 w-full" data-name="Icon">
                        <div className="absolute inset-[20.84%_8.33%]" data-name="Vector">
                          <div className="absolute inset-[-7.14%_-5%]">
                            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12.8339 9.33261">
                              <path d={svgPaths.p375bb800} id="Vector" stroke="var(--stroke-0, #90A1B9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                            </svg>
                          </div>
                        </div>
                        <div className="absolute inset-[37.5%]" data-name="Vector">
                          <div className="absolute inset-[-16.67%]">
                            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 4.66667 4.66667">
                              <path d={svgPaths.p22c75d80} id="Vector" stroke="var(--stroke-0, #90A1B9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex h-[14px] items-start justify-end relative shrink-0 w-full" data-name="Container">
                  <Wrapper additionalClassNames="h-[14px] w-[91.758px]">
                    <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[14px] left-[46px] not-italic text-[#3f5185] text-[10.5px] text-center top-0 tracking-[0.0923px] whitespace-nowrap">Forgot password?</p>
                  </Wrapper>
                </div>
                <div className="bg-[#3f5185] h-[38.5px] relative rounded-[11px] shrink-0 w-full" data-name="Button">
                  <p className="-translate-x-1/2 absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[21px] left-[157.98px] not-italic text-[14px] text-center text-white top-[8.75px] tracking-[-0.1504px] whitespace-nowrap">{`Sign In `}</p>
                  <Icon additionalClassNames="left-[187.51px] top-[12.25px]">
                    <path d="M2.91667 7H11.0833" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                    <path d={svgPaths.pf23dd00} id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                  </Icon>
                </div>
              </div>
              <div className="absolute content-stretch flex gap-[10.5px] h-[15px] items-center left-0 pr-[-0.008px] top-[357.5px] w-[336px]" data-name="LoginPage">
                <div className="bg-[#e2e8f0] flex-[105.602_0_0] h-px min-h-px min-w-px" data-name="Container" />
                <Wrapper additionalClassNames="h-[15px] w-[103.805px]">
                  <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[15px] left-0 not-italic text-[#90a1b9] text-[10px] top-[0.5px] tracking-[0.1172px] uppercase whitespace-nowrap">or continue with</p>
                </Wrapper>
                <div className="bg-[#e2e8f0] flex-[105.602_0_0] h-px min-h-px min-w-px" data-name="Container" />
              </div>
              <div className="absolute gap-x-[7px] gap-y-[7px] grid grid-cols-[repeat(2,minmax(0,1fr))] grid-rows-[repeat(1,minmax(0,1fr))] h-[40.5px] left-0 top-[393.5px] w-[336px]" data-name="LoginPage">
                <div className="bg-white col-1 justify-self-stretch relative rounded-[11px] row-1 self-stretch shrink-0" data-name="Button">
                  <div aria-hidden="true" className="absolute border border-[#e2e8f0] border-solid inset-0 pointer-events-none rounded-[11px]" />
                  <div className="absolute h-[24.5px] left-[52.07px] top-[8px] w-[11.539px]" data-name="Text">
                    <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[24.5px] left-[6px] not-italic text-[#1e293b] text-[15.75px] text-center top-0 tracking-[-0.2922px] whitespace-nowrap">G</p>
                  </div>
                  <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[17.5px] left-[92.11px] not-italic text-[#1e293b] text-[12.25px] text-center top-[12px] tracking-[-0.0179px] whitespace-nowrap">{` Google`}</p>
                </div>
                <div className="bg-white col-2 justify-self-stretch relative rounded-[11px] row-1 self-stretch shrink-0" data-name="Button">
                  <div aria-hidden="true" className="absolute border border-[#e2e8f0] border-solid inset-0 pointer-events-none rounded-[11px]" />
                  <div className="absolute h-[24.5px] left-[58.05px] top-[8px] w-[16px]" data-name="Text">
                    <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[24.5px] left-[8px] not-italic text-[#1e293b] text-[15.75px] text-center top-0 tracking-[-0.2922px] whitespace-nowrap">🔑</p>
                  </div>
                  <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[17.5px] left-[94.55px] not-italic text-[#1e293b] text-[12.25px] text-center top-[12px] tracking-[-0.0179px] whitespace-nowrap">{` SSO`}</p>
                </div>
              </div>
              <div className="absolute h-[21px] left-0 top-[455px] w-[336px]" data-name="LoginPage">
                <p className="-translate-x-1/2 absolute font-['Inter:Regular',sans-serif] font-normal leading-[17.5px] left-[121.04px] not-italic text-[#62748e] text-[12.25px] text-center top-[2.5px] tracking-[-0.0179px] whitespace-nowrap">{`Don't have an account? `}</p>
                <div className="absolute h-[21px] left-[190.05px] top-0 w-[94.398px]" data-name="Button">
                  <p className="-translate-x-1/2 absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[21px] left-[47px] not-italic text-[#f54476] text-[14px] text-center top-0 tracking-[-0.1504px] whitespace-nowrap">Start free trial</p>
                </div>
              </div>
            </Wrapper>
          </div>
        </div>
      </div>
    </div>
  );
}