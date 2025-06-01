import React, {useEffect, useRef, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {useAuth} from "../context/AuthContext";
import {useMediaItem} from "../hooks/useMediaData";
import PlayerContainer from "../components/player/PlayerContainer.tsx";


const TestPage: React.FC = () => {
    const {itemId} = useParams<{ itemId: string }>();
    const {item, isLoading} = useMediaItem(itemId);
    const {api} = useAuth();
    const navigate = useNavigate();


    return (
        <PlayerContainer />
    );
};

export default TestPage;
