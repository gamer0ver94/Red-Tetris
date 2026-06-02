import "./Logo.css";

type Props = {
    text:string;
    imagePath:string;
}
export default function Logo({text, imagePath}:Props){
    return (
        <div>
            <img className="slogan neon" src={imagePath} alt=""/>
            <h1>{text}</h1>
        </div>
    )
}