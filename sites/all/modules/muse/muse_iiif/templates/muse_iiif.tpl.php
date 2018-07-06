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
<?php endif; ?>

 