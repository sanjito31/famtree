import { Point } from "@/types";

interface PersonNodeProps extends Point {
    name: string
}

export default function PersonNode( { name, x, y }: PersonNodeProps) {
    return(
        <div 
            className="absolute 
                        w-7.5 h-7.5 
                        text-black
                        bg-gray-200 border border-gray-700 
                        flex items-center justify-center "
            style={{ left: x, top: y }}
        >
            {name}
        </div>
    )
}