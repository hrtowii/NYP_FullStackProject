import React, { useState } from 'react';
import { Box, Modal } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import CloseIcon from '@mui/icons-material/Close';
const API_BASE_URL = 'http://localhost:3000';
import { backendRoute } from '../utils/BackendUrl'


const ImageGallery = ({ event, backendRoute }) => {
    const [enlargedImage, setEnlargedImage] = useState(null);

    const handleImageClick = (imageUrl) => {
        setEnlargedImage(imageUrl);
    };

    const handleCloseEnlargedImage = () => {
        setEnlargedImage(null);
    };

    return (
        <>
            {event.images && event.images.length > 0 && (
                <Box sx={{ display: 'flex', mt: 2 }}>
                    {event.images.map((EventImage, index) => (
                        <Box
                            key={index}
                            sx={{
                                position: 'relative',
                                width: 80,
                                height: 80,
                                mr: 1,
                                cursor: 'pointer',
                            }}
                            onClick={() => handleImageClick(`${backendRoute}/public/${EventImage.url}`)}
                        >
                            <Box
                                sx={{
                                    width: '100%',
                                    height: '100%',
                                    backgroundImage: `url(${backendRoute}/public/${EventImage.url})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                }}
                            />
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'rgba(0, 0, 0, 0.3)',
                                    opacity: 0,
                                    transition: 'opacity 0.2s',
                                    '&:hover': {
                                        opacity: 1,
                                    },
                                }}
                            >
                                <ZoomInIcon sx={{ color: 'white' }} />
                            </Box>
                        </Box>
                    ))}
                </Box>
            )}

            <Modal
                open={enlargedImage !== null}
                onClose={handleCloseEnlargedImage}
                aria-labelledby="enlarged-image-modal"
                aria-describedby="modal-to-display-enlarged-image"
            >
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '80%',
                    height: '80%',
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    p: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <CloseIcon
                        sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            cursor: 'pointer',
                            color: 'text.secondary',
                        }}
                        onClick={handleCloseEnlargedImage}
                    />
                    {enlargedImage && (
                        <img
                            src={enlargedImage}
                            alt="Enlarged event image"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                            }}
                        />
                    )}
                </Box>
            </Modal>
        </>
    );
};

export default ImageGallery;