import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import { connect } from 'react-redux';
import request from 'superagent';
import Dropzone from 'react-dropzone';
import { photosUploaded, updateUploadedPhoto } from '../actions';
import UploadedPhotoStatusContainer from './UploadedPhotosStatus';

class PhotosUploader extends Component {
    constructor(props, context) {
        super(props, context);
        this.state = { uploadedPhotos: [] , cloudName: context.cloudName, uploadPreset : context.uploadPreset};
        this.photoId = 1;
    }
    componentDidMount(){
        window.addEventListener("paste", this.handlePaste);
    }
    render() {
        return (
            <div>
                <Dropzone
                    id="direct-upload-dropzone"
                    disableClick={true}
                    multiple={false}
                    accept="image/*"
                    style={{ position: 'relative' }}
                    onDrop={
                            this.onPhotoSelected.bind(this),
                            this.handlePaste.bind(this)
                        }
                >
                    <div id="direct_upload">
                        <h1>Upload Photo</h1>
                        <p>
                            You can copy paste image.
                        </p>
                        <form>
                            <div className="form_line" style={{"display":"none"}}>
                                <label path="title">Title:</label>
                                <div className="form_controls">
                                    <input
                                        type="text"
                                        ref={titleEl =>
                                            (this.titleEl = titleEl)
                                        }
                                        className="form-control"
                                        placeholder="Title"
                                    />
                                </div>
                            </div>
                            <div className="form_line">
                                <label>Image:</label>
                                <div className="form_controls">
                                    <div className="upload_button_holder">
                                        <label
                                            className="upload_button"
                                            htmlFor="fileupload"
                                        >
                                            Upload
                                        </label>
                                        <input
                                            type="file"
                                            id="fileupload"
                                            accept="image/*"
                                            multiple="multiple"
                                            ref={fileInputEl =>
                                                (this.fileInputEl = fileInputEl)
                                            }
                                            onChange={() =>
                                                this.onPhotoSelected(
                                                    this.fileInputEl.files
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        </form>
                        <h2>Status</h2>
                    </div>
                    {this.props.uploadedPhotos.map((uploadedPhoto, index) => {
                        return (
                            <UploadedPhotoStatusContainer
                                key={index}
                                uploadedPhoto={uploadedPhoto}
                            />
                        );
                    })}
                </Dropzone>
            </div>
        );
    }

    handlePost = (file,id) => {

    }
    handlePaste = (event) => {
        try {
            
        var items = (event.clipboardData || event.originalEvent.clipboardData).items
        } catch (error) {
            return
        }

        var st = this.state
        var th = this
        for (var index in items) {
            var item = items[index];
            if (item.kind === 'file' && item.type.startsWith("image")) {
                var blob = item.getAsFile();
                var reader = new FileReader();
                reader.onload = function(event){
                    var b64 = event.target.result
                    const url = `https://api.cloudinary.com/v1_1/${
                            st.cloudName
                        }/upload`;
                    request.post(url)
                        .field('upload_preset', st.uploadPreset)
                        .field('file', b64)
                        .field('multiple', true)
                        .field('tags', 'widget')
                        .on('progress', (progress) => th.onPhotoUploadProgress(th.photoId, "From Clipboard", progress))
                        .end((error, response) => {
                            th.onPhotoUploaded(th.photoId++, "From Clipboard", response);
                        });
                    
                }; // data url!
                reader.readAsDataURL(blob);
            }
        }
    }
    onPhotoSelected(files) {
        const title = this.titleEl.value;
        for (let file of files) {
            const photoId = this.photoId++;
            const url = `https://api.cloudinary.com/v1_1/${
                    this.context.cloudName
                }/upload`;
            const fileName = file.name;
            request.post(url)
                .field('upload_preset', this.context.uploadPreset)
                .field('file', file)
                .field('multiple', true)
                .field('tags', 'widget')
                .on('progress', (progress) => this.onPhotoUploadProgress(photoId, file.name, progress))
                .end((error, response) => {
                    this.onPhotoUploaded(photoId, fileName, response);
                });
        }
    }
    onPhotoUploadProgress(id, fileName, progress) {
        this.props.onUpdateUploadedPhoto({
            id: id,
            fileName: fileName,
            progress: progress,
        });
    }

    onPhotoUploaded(id, fileName, response) {
        this.props.onUpdateUploadedPhoto({
            id: id,
            fileName: fileName,
            response: response,
        });

        this.props.onPhotosUploaded([response.body]);
    }
}

PhotosUploader.propTypes = {
    uploadedPhotos: PropTypes.array,
    onUpdateUploadedPhoto: PropTypes.func,
    onPhotosUploaded: PropTypes.func,
};

PhotosUploader.contextTypes = {
    cloudName: PropTypes.string,
    uploadPreset: PropTypes.string,
};

const PhotosUploaderContainer = connect(
    state => state,
    {
        onUpdateUploadedPhoto: updateUploadedPhoto,
        onPhotosUploaded: photosUploaded,
    }
)(PhotosUploader);

Object.assign(
    PhotosUploaderContainer.contextTypes,
    PhotosUploader.contextTypes
);

export default PhotosUploaderContainer;
