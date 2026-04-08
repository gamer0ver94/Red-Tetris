import "./Logo.css";

type Props = {
    text:string;
    imagePath:string;
}
export default function Logo({text, imagePath}:Props){
    return (
        <div>
            <img src={imagePath} alt=""  width={200}/>
            <h1>{text}</h1>
        </div>
    )
}