import PersonNode from "./PersonNode"
import { Point } from "@/types"

interface TreeCanvasProps {
    offset: Point
}

export default function TreeCanvas({ offset }: TreeCanvasProps) {
    
    return(
        <div className="relative" style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}>
            <PersonNode name="Sanjay" x={100} y={100}/>
            <PersonNode name="Jay" x={50} y={0} />
            <PersonNode name="Rebecca" x={150} y={0} />
        </div>
    )
}