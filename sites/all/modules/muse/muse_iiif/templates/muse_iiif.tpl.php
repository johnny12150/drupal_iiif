<?php

/**
 * @file
 * Default theme implementation to display a IIIF image.
 *
 * Available variables:
 * - $link_url - The IIIF  to link the image to. Optional.
 * @see template_preprocess()
 * @see template_process()
 *
 * @ingroup themeable
 */
?>
<?php if ($link_url): ?>
    <div class="iiif-viewer" data-url="<?php print $link_url; ?>"></div>
    <!--add-->
    <div id="confirmOverlay" style="display: none;">
        <div id="confirmBox">
            <textarea name="editor" id="editor" cols="30" rows="10" placeholder="123"></textarea>
            <div id="confirmButtons">
                <a id='annotation_save' class="button blue">save<span></span></a>
                <a id='annotation_cancel' class="button gray">cancel<span></span></a>
            </div>
        </div>
    </div>
    <!--end-->
<?php endif; ?>

 