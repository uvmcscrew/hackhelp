import {
	Body,
	Button,
	Column,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Img,
	Link,
	Preview,
	Row,
	Section,
	Tailwind,
	Text
} from '@react-email/components';

export type MagicLinkEmailProps = {
	username: string;
	magicLink: string;
	fromIp: string;
};

export const MagicLinkEmail = ({ username, magicLink, fromIp }: MagicLinkEmailProps) => {
	const previewText = `HackHelp Login Link`;

	return (
		<Html>
			<Head />
			<Tailwind>
				<Body className="mx-auto my-auto bg-white px-2 font-sans">
					<Preview>{previewText}</Preview>
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
							HackHelp Login Link
						</Heading>
						<Text className="text-[14px] leading-6 text-black">Hello {username},</Text>
						<Text>
							You have requested a login link for HackHelp. Here it is, fresh off the presses!
						</Text>
						<Section className="mt-8 mb-8 text-center">
							<Button
								className="rounded bg-[#000000] px-5 py-3 text-center text-[12px] font-semibold text-white no-underline"
								href={magicLink}
							>
								Login to HackHelp
							</Button>
						</Section>
						<Text className="text-[14px] leading-6 text-black">
							or copy and paste this URL into your browser:{' '}
							<Link href={magicLink} className="text-blue-600 no-underline">
								{magicLink}
							</Link>
						</Text>
						<Hr className="mx-0 my-6.5 w-full border border-solid border-[#eaeaea]" />
						<Text className="text-[12px] leading-6 text-[#666666]">
							This invitation was intended for <span className="text-black">{username}</span>. This
							invite was sent from <span className="text-black">{fromIp}</span>. If you were not
							expecting this login request, you can ignore this email. If you are concerned about
							your account's safety, please contact the hackathon organizers.
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
};

MagicLinkEmail.PreviewProps = {
	username: 'henrikvtcodes',
	magicLink: 'https://hackhelp.unicycl.ing/auth/login/magic',
	fromIp: '132.198.201.10'
} as MagicLinkEmailProps;

export default MagicLinkEmail;
