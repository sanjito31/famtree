"use client"

import { useRef, useState } from "react";
import Viewport from "./Viewport";
import TreeCanvas from "./TreeCanvas";
import { Point } from "@/types";


export default function FamilyTreeViewer() {
    
    const [offset, setOffset] = useState<Point>({ x: 0, y: 0 })
    const [isPanning, setIsPanning] = useState<boolean>(false)
    const panStart = useRef<Point>({ x: 0, y: 0 })
    const offsetStart = useRef<Point>({ x: 0, y: 0 })
    
    const handleMouseDown = ( e: React.MouseEvent ) => {
        setIsPanning(true)
        panStart.current = { x: e.clientX, y: e.clientY }
        offsetStart.current = { x: offset.x, y: offset.y}
    }
    
    const handleMouseMove = (e: React.MouseEvent ) => {
        
        if (!isPanning) return;
        
        const dx = e.clientX - panStart.current.x;
        const dy = e.clientY - panStart.current.y;
        
        setOffset({
            x: offsetStart.current.x + dx,
            y: offsetStart.current.y + dy,
        });
    };

    const handleMouseUp = () => {
        setIsPanning(false);
    };
    

    return(
        <div>
            <Viewport 
                onMouseDown={handleMouseDown} 
                onMouseMove={handleMouseMove} 
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <TreeCanvas offset={offset} />
            </Viewport>
        </div>
    )
}