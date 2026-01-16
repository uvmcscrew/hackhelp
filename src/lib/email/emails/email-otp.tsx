import {
	Body,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Img,
	Preview,
	Section,
	Tailwind,
	Text,
	CodeInline
} from '@react-email/components';

export type OTPEmailProps = {
	type: 'email-verification' | 'sign-in' | 'forget-password';
	username?: string;
	otp: string;
	fromIp?: string;
};

export const OTPEmail = ({ username, type = 'email-verification', otp, fromIp }: OTPEmailProps) => {
	let title =
		type === 'email-verification'
			? 'Email Verification Code'
			: type === 'sign-in'
				? 'Sign-in Code'
				: 'Password Reset Code';

	return (
		<Html>
			<Head />
			<Tailwind>
				<Body className="mx-auto my-auto bg-white px-2 font-sans">
					<Preview>{`${title} | HackHelp`}</Preview>
					<Container className="mx-auto my-10 max-w-116.25 rounded border border-solid border-[#eaeaea] p-5">
						<Section className="mt-8">
							<Img
								src={`https://cscrew.w3.uvm.edu/UVM_V_G.png`}
								width="40"
								height="37"
								alt="HackHelp"
								className="mx-auto my-0"
							/>
						</Section>
						<Heading className="mx-0 my-7.5 p-0 text-center text-[24px] font-normal text-black">
							HackHelp {title}
						</Heading>
						{/* <Text className="text-[14px] leading-6 text-black">Hello {username},</Text> */}
						<Text className="text-[14px] leading-6 text-black">Hello!</Text>{' '}
						<Text>
							You have requested a {title.toLowerCase()} for HackHelp. Here it is, fresh off the
							presses!
						</Text>
						<Section className="mx-0 my-7.5 p-0 text-center text-[24px]">
							<CodeInline>{otp}</CodeInline>
						</Section>
						<Hr className="mx-0 my-6.5 w-full border border-solid border-[#eaeaea]" />
						<Text className="text-[12px] leading-6 text-[#666666]">
							{/* This email was intended for <span className="text-black">{username}</span>. This
							invite was sent from <span className="text-black">{fromIp}</span>.  */}
							If you were not expecting this, you can ignore this email. If you are concerned about
							your account's safety, please contact the hackathon organizers.
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
};

OTPEmail.PreviewProps = {
	username: 'henrikvtcodes',
	otp: 'ab1245',
	fromIp: '132.198.201.10'
} as OTPEmailProps;

export default OTPEmail;
