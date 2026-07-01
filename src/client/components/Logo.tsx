import "./Logo.css";

type Props = {
    text:string;
    imagePath:string;
}
export default function Logo({ imagePath }: Props) {
  return (
      <img className="slogan neon" src={imagePath} alt="" />
  );
}
